import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User, UserRole, UserStatus } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(
    phone: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole = UserRole.CLIENT,
  ) {
    const existing = await this.usersService.findByPhone(phone);
    if (existing) {
      throw new BadRequestException('Ce numéro de téléphone est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await this.usersService.create({
      phone,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      status: UserStatus.ACTIVE,
      phoneVerified: true,
      otpCode: null,
      otpExpiresAt: null,
    });

    return {
      message: 'Compte créé avec succès.',
      userId: user.id,
    };
  }

  async login(phone: string, password: string) {
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException('Compte bloqué');
    }

    return this.generateToken(user);
  }

  // On ajoute une fonction vide pour satisfaire le controller
  async verifyOtp(phone: string, otpCode: string) {
    // Cette fonction ne fait plus rien, mais elle existe
    return { message: "Vérification OTP désactivée." };
  }

  private generateToken(user: User) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
      },
    };
  }
}
