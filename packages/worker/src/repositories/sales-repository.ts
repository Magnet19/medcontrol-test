import type {
  ApiSource,
  SalesAggregate,
  SalesPeriod,
  SalesRepository,
} from '@report-platform/shared';

interface JsonPlaceholderPost {
  userId: number;
  id: number;
  title: string;
  body: string;
}

const PERIOD_LIMIT: Record<SalesPeriod, number> = {
  day: 10,
  week: 40,
  month: 100,
};

export function createSalesRepository(api: ApiSource): SalesRepository {
  return {
    async summarize(period: SalesPeriod): Promise<SalesAggregate[]> {
      const limit = PERIOD_LIMIT[period];
      const posts = await api.get<JsonPlaceholderPost[]>('posts', { _limit: limit });
      const uniqueSellers = new Set(posts.map((p) => p.userId)).size;
      const totalSales = posts.length;
      const revenue = posts.reduce((sum, p) => sum + p.title.length * 100, 0);
      const avgCheck = totalSales === 0 ? 0 : Math.round(revenue / totalSales);
      return [
        { label: 'Выручка', value: revenue },
        { label: 'Продаж', value: totalSales },
        { label: 'Продавцов', value: uniqueSellers },
        { label: 'Средний чек', value: avgCheck },
      ];
    },
  };
}
