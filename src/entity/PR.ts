import {Entity, ObjectIdColumn, ObjectID, Column, BaseEntity} from 'typeorm';

@Entity()
export class PR extends BaseEntity {
	@ObjectIdColumn()
	id: ObjectID;

	@Column()
	number!: number;
}
