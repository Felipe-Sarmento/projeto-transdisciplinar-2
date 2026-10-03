import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class ProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsUrl()
  imageUrl?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  availableQuantity: number;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  active: boolean;
}
