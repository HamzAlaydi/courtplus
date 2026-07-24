import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '@googlemaps/google-maps-services-js';
import { Location } from './entities/location.entity';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { CoordinatesDto } from './dto/create-branch.dto';
import { Transactional } from 'typeorm-transactional';
@Injectable()
export class LocationsService {
  private client: Client;
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    private readonly configService: ConfigService,
  ) {
    this.client = new Client({});
  }

  async getPlaceDetails(placeId: string) {
    const response = await this.client.placeDetails({
      params: {
        place_id: placeId,
        key: this.configService.get('google.mapsApiKey'),
      },
    });

    return response.data.result;
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
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: this.configService.get('google.mapsApiKey'),
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        const countryResult = response.data.results[0];
        return this.extractCountry(countryResult.address_components);
      }

      return null;
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
