import { Service } from "typedi";
import { UserRepository } from "./user.repository";
import { verifyToken as verifyJWT } from "../../server/utils/jwt.util";

@Service()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getAllUsers(filters?: any) {
    return await this.userRepository.findAll(filters);
  }

  async searchUsers(query: string, role?: string) {
    return await this.userRepository.search(query, role);
  }

  async findById(id: number) {
    return await this.userRepository.findById(id);
  }

  async verifyToken(token: string) {
    return verifyJWT(token);
  }
}