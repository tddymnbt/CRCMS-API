import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Roles } from '../../domain/entities/roles.entity';
import { UserRoles } from '../../domain/entities/user-roles.entity';
import { RbacRepositoryPort } from '../../domain/repositories/rbac.repository.port';

@Injectable()
export class TypeormRbacRepository implements RbacRepositoryPort {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepo: Repository<Roles>,

    @InjectRepository(UserRoles)
    private readonly userRoleRepo: Repository<UserRoles>,
  ) {}

  findAllRoles(): Promise<Roles[]> {
    return this.roleRepo.find();
  }

  findRoleByName(name: string): Promise<Roles | null> {
    return this.roleRepo.findOne({
      where: { name: ILike(name.trim()) },
    });
  }

  findRoleById(id: number): Promise<Roles | null> {
    return this.roleRepo.findOne({ where: { id } });
  }

  findUserRoleByUserId(userId: string): Promise<UserRoles | null> {
    return this.userRoleRepo.findOne({
      where: { user_id: userId.trim() },
    });
  }

  saveUserRole(userRole: Partial<UserRoles>): Promise<UserRoles> {
    return this.userRoleRepo.save(userRole);
  }
}
