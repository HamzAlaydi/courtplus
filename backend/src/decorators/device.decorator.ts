import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Request } from 'express';

export const DeviceId = createParamDecorator(
    (
        required: boolean = true,
        ctx: ExecutionContext,
    ) => {
        const request: Request = ctx.switchToHttp().getRequest();
        const deviceId = request.headers['x-device-id'];
        if (!deviceId && required) {
            throw new BadRequestException('Device ID is required');
        }
        return deviceId;
    },
);
