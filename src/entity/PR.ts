import { Entity, ObjectIdColumn, ObjectID, Column, BaseEntity } from 'typeorm';
import { K8sResourceMetadata, DeploymentVariables } from '../types';

@Entity()
export class PR extends BaseEntity {
	@ObjectIdColumn()
	id: ObjectID;

	@Column()
	created_at: Date;

	@Column()
	updated_at: Date;

	@Column()
	deploymentVars: DeploymentVariables;

	@Column('simple-json')
	resources: K8sResourceMetadata[];

	@Column({ default: false })
	undeployed = false;
}
