import { CartService, type CartItem } from './cart.service';
import type { ProductsService } from './products.service';

const product = (
  id: number,
  price: number,
  availableQuantity: number,
  active = true,
) => ({
  id,
  name: `Produto ${id}`,
  description: '',
  price,
  imageUrl: null,
  active,
  availableQuantity,
  categoryId: 1,
  createdAt: new Date(),
});

function buildService(products: Record<number, ReturnType<typeof product>>) {
  const productsService = {
    findById: (id: number) => products[id],
  } as unknown as ProductsService;

  return new CartService(productsService);
}

describe('CartService', () => {
  const service = buildService({});

  describe('parse', () => {
    it('descarta entradas inválidas e mescla duplicadas', () => {
      const items = service.parse([
        { productId: 1, quantity: 2 },
        { productId: 1, quantity: 3 },
        { productId: 'x', quantity: 1 },
        { productId: 2, quantity: -1 },
        null,
      ]);

      expect(items).toEqual([{ productId: 1, quantity: 5 }]);
    });

    it('trata valor não-array como vazio', () => {
      expect(service.parse('nope')).toEqual([]);
    });
  });

  describe('add', () => {
    it('adiciona novo item', () => {
      expect(service.add([], 1, 2, 10)).toEqual([
        { productId: 1, quantity: 2 },
      ]);
    });

    it('mescla somando a quantidade (RN04)', () => {
      const items: CartItem[] = [{ productId: 1, quantity: 2 }];
      expect(service.add(items, 1, 3, 10)).toEqual([
        { productId: 1, quantity: 5 },
      ]);
    });

    it('limita ao estoque disponível (RN14)', () => {
      expect(service.add([], 1, 50, 8)).toEqual([
        { productId: 1, quantity: 8 },
      ]);
    });
  });

  describe('update', () => {
    it('limita a quantidade ao estoque', () => {
      const items: CartItem[] = [{ productId: 1, quantity: 2 }];
      expect(service.update(items, 1, 40, 10)).toEqual([
        { productId: 1, quantity: 10 },
      ]);
    });

    it('remove quando a quantidade é zero ou negativa', () => {
      const items: CartItem[] = [{ productId: 1, quantity: 2 }];
      expect(service.update(items, 1, 0, 10)).toEqual([]);
    });
  });

  describe('remove e totalQuantity', () => {
    it('remove o item', () => {
      expect(service.remove([{ productId: 1, quantity: 1 }], 1)).toEqual([]);
    });

    it('soma as quantidades', () => {
      expect(
        service.totalQuantity([
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 3 },
        ]),
      ).toBe(5);
    });
  });

  describe('buildView', () => {
    it('calcula subtotal e ignora indisponíveis', () => {
      const svc = buildService({
        1: product(1, 10, 5),
        2: product(2, 4, 0),
        3: product(3, 8, 5, false),
      });

      const view = svc.buildView([
        { productId: 1, quantity: 3 },
        { productId: 2, quantity: 1 },
        { productId: 3, quantity: 1 },
      ]);

      expect(view.lines).toHaveLength(1);
      expect(view.subtotal).toBe(30);
      expect(view.count).toBe(3);
    });

    it('limita a quantidade da linha ao estoque', () => {
      const svc = buildService({ 1: product(1, 10, 2) });
      const view = svc.buildView([{ productId: 1, quantity: 5 }]);

      expect(view.lines[0].quantity).toBe(2);
      expect(view.subtotal).toBe(20);
    });
  });
});
