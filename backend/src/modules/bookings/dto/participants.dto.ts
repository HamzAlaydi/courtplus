import { ApiProperty } from "@nestjs/swagger";
import { ArrayUnique, IsArray, IsUUID } from "class-validator";

export class ParticipantsDto {
    @ApiProperty({
        description: 'The IDs of the users to be added/removed from the booking',
        type: [String],
    })
    @IsArray()
    @IsUUID('4', { each: true })
    @ArrayUnique()
    userIds: string[];
}