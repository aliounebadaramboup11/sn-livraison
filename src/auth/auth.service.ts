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
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await this.usersService.create({
      phone,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      status: role === UserRole.LIVREUR ? UserStatus.PENDING : UserStatus.ACTIVE,
      otpCode,
      otpExpiresAt,
      phoneVerified: false,
    });

    // TODO: Envoyer l'OTP par SMS (simulé pour l'instant via log)
    console.log(`📱 OTP pour ${phone}: ${otpCode}`);

    return {
      message: 'Compte créé. Vérifiez votre téléphone pour le code OTP.',
      userId: user.id,
    };
  }

  async verifyOtp(phone: string, otpCode: string) {
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    if (user.otpCode !== otpCode) {
      throw new UnauthorizedException('Code OTP invalide');
    }
    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('Code OTP expiré');
    }

    await this.usersService.update(user.id, {
      phoneVerified: true,
      otpCode: null,
      otpExpiresAt: null,
    });

    return this.generateToken(user);
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
