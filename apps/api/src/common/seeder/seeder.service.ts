import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Modules } from 'src/modules/rbac/entities/modules.entity';
import { RolePermissions } from 'src/modules/rbac/entities/role-permissions.entity';
import { Permissions } from 'src/modules/rbac/entities/permissions.entity';
import { Roles } from 'src/modules/rbac/entities/roles.entity';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    @InjectRepository(Roles) private roleRepo: Repository<Roles>,
    @InjectRepository(Permissions) private permissionRepo: Repository<Permissions>,
    @InjectRepository(Modules) private moduleRepo: Repository<Modules>,
    @InjectRepository(RolePermissions) private rolePermissionRepo: Repository<RolePermissions>,
  ) {}

  async onModuleInit() {
    await this.seedRoles();
    await this.seedModules();
    await this.seedPermissions();
    await this.seedRolePermissions();
  }

  private async seedRoles() {
    const count = await this.roleRepo.count();
    if (count === 0) {
      await this.roleRepo.save([
        { name: 'Admin', description: 'Administrator role' },
        { name: 'Staff', description: 'Staff role' },
      ]);
    }
  }

  private async seedModules() {
    const count = await this.moduleRepo.count();
    if (count === 0) {
      await this.moduleRepo.save([
        { name: 'Users', description: 'User management' },
        { name: 'Sales', description: 'Sales module' },
        { name: 'Inventory', description: 'Inventory tracking' },
        { name: 'Clients', description: 'Client handling' },
        { name: 'Reports', description: 'Reports and analytics' },
      ]);
    }
  }

  private async seedPermissions() {
    const count = await this.permissionRepo.count();
    if (count === 0) {
      const modules = ['Users', 'Sales', 'Inventory', 'Clients', 'Reports'];
      const actions = ['create', 'read', 'update', 'delete'];

      const permissions = modules.flatMap((mod) =>
        actions.map((action) => ({
          name: `${mod}.${action}`,
          description: `${action} permission for ${mod}`,
        })),
      );

      await this.permissionRepo.save(permissions);
    }
  }

  private async seedRolePermissions() {
    const count = await this.rolePermissionRepo.count();
    if (count > 0) return;

    const roles = await this.roleRepo.find();
    const modules = await this.moduleRepo.find();
    const permissions = await this.permissionRepo.find();

    const roleMap = new Map(roles.map((r) => [r.name, r.id]));
    const moduleMap = new Map(modules.map((m) => [m.name, m.id]));
    const permMap = new Map(permissions.map((p) => [p.name, p]));

    const rolePermissionsData = [
      {
        role: 'Admin',
        permissions: Array.from(permMap.keys()), // all permissions
      },
      {
        role: 'Staff',
        permissions: Array.from(permMap.keys()).filter((perm) =>
          ['read', 'update'].some((act) => perm.includes(`.${act}`)),
        ),
      },
    ];

    const rolePermEntities: {role_id: number, module_id: number, permission_id: number}[] = [];

    for (const entry of rolePermissionsData) {
      const roleId = roleMap.get(entry.role);
      if (!roleId) continue;

      for (const permName of entry.permissions) {
        const permission = permMap.get(permName);
        if (!permission) continue;

        const moduleName = permName.split('.')[0];
        const moduleId = moduleMap.get(moduleName);
        if (!moduleId) continue;
        
        
        rolePermEntities.push({
            role_id: roleId,
            module_id: moduleId,
            permission_id: permission.id,
          });
      }
    }

    await this.rolePermissionRepo.save(rolePermEntities);
  }
}