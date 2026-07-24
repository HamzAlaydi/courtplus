import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { Injectable } from '@nestjs/common';
import { CoordinatesDto } from './dto/create-branch.dto';
import { Transactional } from 'typeorm-transactional';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
// Required by the Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
const NOMINATIM_USER_AGENT = 'CourtPlusApp/1.0 (contact@courtplusapp.com)';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  private async nominatimRequest(path: string, params: Record<string, string>) {
    const url = new URL(`${NOMINATIM_BASE_URL}${path}`);
    url.search = new URLSearchParams({ format: 'json', ...params }).toString();

    const response = await fetch(url, {
      headers: { 'User-Agent': NOMINATIM_USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`Nominatim request failed with status ${response.status}`);
    }

    return response.json();
  }

  async getPlaceDetails(placeId: string) {
    const results = await this.nominatimRequest('/search', {
      q: placeId,
      addressdetails: '1',
      limit: '1',
    });

    if (!Array.isArray(results) || results.length === 0) {
      throw new Error(`No place found for query: ${placeId}`);
    }

    const result = results[0];

    return {
      place_id: result.place_id,
      name: result.display_name.split(',')[0].trim(),
      formatted_address: result.display_name,
      address_components: this.toAddressComponents(result.address),
      geometry: {
        location: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        },
      },
      raw: result,
    };
  }

  async getByPlaceId(placeId: string) {
    return this.locationRepository.findOne({
      where: {
        placeId,
      },
    });
  }

  @Transactional()
  async addLocation(placeId: string) {
    const location = await this.getByPlaceId(placeId);
    if (location) {
      return location;
    }
    const placeDetails = await this.getPlaceDetails(placeId);

    return this.locationRepository.save({
      placeId,
      name: placeDetails.name,
      address: placeDetails.formatted_address,
      country: this.extractCountry(placeDetails.address_components),
      data: placeDetails,
      coordinates: {
        type: 'Point',
        coordinates: [
          placeDetails.geometry.location.lng,
          placeDetails.geometry.location.lat,
        ],
      },
    });
  }

  @Transactional()
  async addLocationWithCoordinates({ coordinates, name, address, country: providedCountry }: {
    coordinates: CoordinatesDto;
    name: string;
    address: string;
    country?: string;
  }) {
    const existingLocation = await this.locationRepository
      .createQueryBuilder('location')
      .where(
        `ST_DWithin(
          location.coordinates::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          10
        )`,
        { lng: coordinates.lng, lat: coordinates.lat }
      )
      .andWhere('location.name = :name', { name })
      .getOne();

    if (existingLocation) {
      return existingLocation;
    }

    let country = providedCountry;
    if (!country) {
      country = await this.getCountryFromCoordinates(coordinates.lat, coordinates.lng);
    }

    return this.locationRepository.save({
      name,
      address,
      country,
      coordinates: {
        type: 'Point',
        coordinates: [coordinates.lng, coordinates.lat],
      },
    });
  }

  private toAddressComponents(address: Record<string, string> | undefined) {
    if (!address || typeof address !== 'object') {
      return [];
    }

    return Object.entries(address).map(([type, value]) => ({
      long_name: value,
      short_name: value,
      types: [type],
    }));
  }

  private extractCountry(addressComponents: any[]): string | null {
    if (!addressComponents || !Array.isArray(addressComponents)) {
      return null;
    }

    const countryComponent = addressComponents.find(
      (component) => component.types && component.types.includes('country'),
    );

    return countryComponent ? countryComponent.long_name : null;
  }

  async getCountryFromCoordinates(lat: number, lng: number): Promise<string | null> {
    try {
      const result = await this.nominatimRequest('/reverse', {
        lat: String(lat),
        lon: String(lng),
        addressdetails: '1',
      });

      const addressComponents = this.toAddressComponents(result?.address);
      return this.extractCountry(addressComponents);
    } catch (error) {
      console.error('Error getting country from coordinates:', error);
      return null;
    }
  }

  calculateDistance(
    { lat: lat1, lon: lon1 }: { lat: number; lon: number },
    { lat: lat2, lon: lon2 }: { lat: number; lon: number },
  ): number {
    const R = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
