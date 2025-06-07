// src/shared/shared.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesItems } from 'src/modules/sales/entities/sale-items.entity';
import { Sales } from 'src/modules/sales/entities/sales.entity';
import { SharedService } from './shared.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sales, SalesItems])],
  providers: [SharedService],
  exports: [SharedService],
})
export class SharedModule {}
