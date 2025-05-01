import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry/dist/cjs';

@Injectable()
export class ProductService {
  // 상품 API의 기본 URL 설정
  private readonly PRODUCT_API = 'https://recruit-dev.lunchlab.me/v1';
  private INSTANCE = axios.create({ baseURL: this.PRODUCT_API });

  constructor() {
    // axios-retry 설정: 네트워크 요청 실패 시 재시도 가능하도록 설정
    axiosRetry(this.INSTANCE, {
      retries: 3, // 최대 3번 재시도
      retryDelay: axiosRetry.exponentialDelay, // 재시도 간격을 지수적으로 증가
      retryCondition: (error: AxiosError<unknown, any>) => {
        // 5xx 서버 오류 발생 시에만 재시도
        return error.response ? error.response.status >= 500 : false;
      },
    });
  }

  async getProductData() {
    try {
      // 상품 목록 가져오기
      const { data: response } = await this.INSTANCE.get('/products');
      if (!response.data || response.data.length === 0) {
        throw new NotFoundException('상품 목록이 비어있습니다.');
      }
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(
        '상품 목록을 가져오는 중 오류가 발생했습니다.',
      );
    }
  }
}
