import type { CatalogRecord, CatalogRepository } from '@report-platform/shared';

const CATALOG_FIXTURE: CatalogRecord[] = [
  { categoryId: 1, categoryName: 'Электроника', region: 'Москва' },
  { categoryId: 2, categoryName: 'Одежда', region: 'Москва' },
  { categoryId: 3, categoryName: 'Продукты питания', region: 'Санкт-Петербург' },
  { categoryId: 4, categoryName: 'Спорт', region: 'Екатеринбург' },
  { categoryId: 5, categoryName: 'Книги', region: 'Казань' },
  { categoryId: 6, categoryName: 'Электроника', region: 'Новосибирск' },
  { categoryId: 7, categoryName: 'Мебель', region: 'Санкт-Петербург' },
];

// Mock-источник: справочные данные (в production читались бы из файла / CMS / MDM-системы)
export function createCatalogRepository(): CatalogRepository {
  return {
    async getCategories(): Promise<CatalogRecord[]> {
      return CATALOG_FIXTURE;
    },
  };
}
