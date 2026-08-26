import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { InternalServerErrorException, UsePipes, ValidationPipe } from '@nestjs/common';
import { AgentsInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/types/dto/member/member.input';
import { Member, Members } from '../../libs/types/dto/member/member';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth/guards/auth.guard';
import { AuthMember } from '../auth/auth/decorators/authMember.decorator';
import * as mongoose from 'mongoose';
import { Roles } from '../auth/auth/decorators/roles.decorator';
import { MemberType } from '../../libs/types/enums/member.enum';
import { RolesGuard } from '../auth/auth/guards/roles.guard';
import { MemberUpdate } from '../../libs/types/dto/member/member.update';
import { shapeIntoMongoObjectId } from '../../libs/types/config';
import { WithoutGuard } from '../auth/auth/guards/without.guard';

@Resolver()
export class MemberResolver {
    constructor (private readonly memberService: MemberService) {}

    // CALLING APIS

    @Mutation(() => Member)
    @UsePipes(ValidationPipe)
    public async signup(@Args("input")input: MemberInput): Promise<Member> {
        console.log("Mutation signup");
        return await this.memberService.signup(input);
    }

    // CALL 
    @Mutation(() => String)
    @UsePipes(ValidationPipe)
    public async login(@Args("input")input: LoginInput): Promise<Member> {
        console.log("Mutation login");
        return await this.memberService.login(input);
    } 
    
    // AUTHENTICATION 
    // CALL 
    @UseGuards(AuthGuard)
    @Query(() => String)
    public async checkAuth(@AuthMember('memberNick') memberNick: string): Promise<string> {
        console.log('Query: checkAuth');
        console.log('memberNick:', memberNick);
        return `Hi ${memberNick}`;
    }

    // AUTHORIZATION = AUTHENTICATION + PERMISSION 
    // CALL
    @Roles(MemberType.USER, MemberType.AGENT)
    @UseGuards(RolesGuard)
    @Query(() => String)
    public async checkAuthRoles(@AuthMember() authMember: Member): Promise<string> {
        console.log('Query: checkAuthRoles');
        return `Hi ${authMember.memberNick}, you are ${authMember.memberType} (memberId: ${authMember._id})`;
    }

    // CALL 
    @UseGuards(AuthGuard)
    @Mutation(() => Member)
    public async updateMember(
        @Args('input') input: MemberUpdate,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Member> {
        console.log('Mutation: updateMember');
        delete input._id;
        return await this.memberService.updateMember(memberId, input);
    }

    // CAll
    @UseGuards(WithoutGuard)
    @Query(() => Member)
    public async getMember(
        @Args('memberId') input: string,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Member> {
        console.log("Query getMember");
        const targetId = shapeIntoMongoObjectId(input);
        return await this.memberService.getMember(memberId, targetId);
    }


    // RETRIEVER
    // CALL
    @UseGuards(WithoutGuard)
    @Query(() => Members)
    public async getAgents(
        @Args('input') input: AgentsInquiry,
        @AuthMember('_id') memberId: mongoose.ObjectId,
    ): Promise<Members> {
        console.log('Query: getAgents');
        return await this.memberService.getAgents(memberId, input);
    }

    /** ADMIN **/
    // CALL
    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard)
    @Query(() => Members)
    public async getAllMembersByAdmin(@Args('input') input: MembersInquiry): Promise<Members> {
        console.log('Query: getAllMembersByAdmin');
        return await this.memberService.getAllMembersByAdmin(input);
    }

    // CALL 
    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard)
    @Mutation(() => Member)
    public async updateMemberByAdmin(@Args('input') input: MemberUpdate): Promise<Member> {
        console.log('Mutation: updateMemberByAdmin');
        return await this.memberService.updateMemberByAdmin(input);
    }


}
