import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IsLatitude, IsLongitude, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
export const Location = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const location = request.headers['x-location'];
    if (!location) {
      return null;
    }
    return UserLocation.fromString(location);
  },
);

export class UserLocation {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  static fromString(value: string): UserLocation {
    if (typeof value === 'string') {
      const [lat, lng] = value.split(',').map(Number);
      const locationObj = { latitude: lat, longitude: lng };
      const location = plainToInstance(UserLocation, locationObj);
      const errors = validateSync(location);
      if (errors.length > 0) {
        throw new Error('Invalid location format');
      }
      return location;
    }
    return value;
  }
}
