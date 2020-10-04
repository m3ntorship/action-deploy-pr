import {Entity, ObjectIdColumn, ObjectID, Column, BaseEntity} from 'typeorm';
import {K8sResourceMetadata, Vars} from '../types';

@Entity()
export class PR extends BaseEntity {
	@ObjectIdColumn()
	id: ObjectID;

	@Column()
	number: string;

	@Column()
	repository: string;

	@Column()
	deploymentVars: Vars;

	@Column('simple-json')
	resources: K8sResourceMetadata[];
}
