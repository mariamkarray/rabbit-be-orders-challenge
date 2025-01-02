import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min } from 'class-validator';
export class GetAllProductsDTO {
  @IsOptional()
  categories?: string[];
  // for pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cursor?: number;
}
