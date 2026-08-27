import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PropertyService } from './property.service';
import { Property } from '../../libs/types/dto/property/property';
import { PropertyInput } from '../../libs/types/dto/property/property.input';
import { MemberType } from '../../libs/types/enums/member.enum';
import { Roles } from '../auth/auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/auth/guards/roles.guard';
import { AuthMember } from '../auth/auth/decorators/authMember.decorator';
import * as mongoose from 'mongoose';

@Resolver()
export class PropertyResolver {
    constructor(private readonly propertyService: PropertyService) {}

    @Roles(MemberType.AGENT)
    @UseGuards(RolesGuard)
    @Mutation(() => Property)
    public async createProperty(
        @Args('input') input: PropertyInput,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Property> {
        console.log('Mutation: createProperty');
        input.memberId = memberId;

        return await this.propertyService.createProperty(input);
    }
}
