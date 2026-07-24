import { BaseEntity } from 'src/common/base-entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import type { Point } from 'geojson';
import { Branch } from './branch.entity';
import { Court } from 'src/modules/courts/entities/court.entity';
@Entity('locations')
@Index('location_place_id_idx', ['placeId'], { unique: true })
@Index('location_coordinates_idx', ['coordinates'], { spatial: true })
export class Location extends BaseEntity {
  @Column()
  @Index()
  name: string;

  @Column({ nullable: true })
  placeId?: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  country?: string;

  @Column('jsonb', { nullable: true })
  data?: object;

  @Column('geography', {
    spatialFeatureType: 'Point',
    srid: 4326,
    name: 'coordinates',
  })
  coordinates: Point;

  lng: number;

  lat: number;

  @OneToMany(() => Branch, (branch) => branch.location)
  branches: Branch[];

  @OneToMany(() => Court, (court) => court.location)
  courts: Court[];
}
