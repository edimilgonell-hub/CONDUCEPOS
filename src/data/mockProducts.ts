import { ProductItem, Client } from '../types';

export const COMPANY_INFO = {
  name: 'MARTINEZ BATISTA COMERCIAL SRL',
  slogan: 'Venta de todo tipo de electrodomésticos!',
  address: 'C/ Duarte NO. 2-571, Jaibón Lag. Sal. Valverde, R.D.',
  rnc: '130963772',
  phone: '809-585-7393',
  email: 'Martinezbcomercial@gmail.com'
};

/**
 * Productos extraídos del documento oficial de cotización de Martinez Batista Comercial SRL.
 * Todos los precios ya tienen el 18% de ITBIS incluido.
 */
export const INITIAL_PRODUCTS: ProductItem[] = [
  // Página 1 del PDF
  { id: 'mb-01', name: 'Carretilla grande', category: 'Ferretería / Hogar', unit: 'Und', unitPrice: 6000 },
  { id: 'mb-02', name: 'Juego de colchón acorchado 54', category: 'Colchones', unit: 'Juego', unitPrice: 6500 },
  { id: 'mb-03', name: 'Hamper', category: 'Plásticos y Hogar', unit: 'Und', unitPrice: 450 },
  { id: 'mb-04', name: 'Armario', category: 'Muebles', unit: 'Und', unitPrice: 8500 },
  { id: 'mb-05', name: 'Juego colchón pilowtop 60', category: 'Colchones', unit: 'Juego', unitPrice: 17500 },
  { id: 'mb-06', name: 'Juego colchón acorchado 60', category: 'Colchones', unit: 'Juego', unitPrice: 8500 },
  { id: 'mb-07', name: 'Abanico discovery plástico pedestal', category: 'Ventilación', unit: 'Und', unitPrice: 3000 },
  { id: 'mb-08', name: 'Tostadora Discovery Home', category: 'Electrodomésticos', unit: 'Und', unitPrice: 2500 },
  { id: 'mb-09', name: 'Juego colchón liso 54', category: 'Colchones', unit: 'Juego', unitPrice: 4500 },
  { id: 'mb-10', name: 'Mecedora de fibra', category: 'Muebles', unit: 'Und', unitPrice: 17500 },
  { id: 'mb-11', name: 'Licuadora oster acromada', category: 'Electrodomésticos', unit: 'Und', unitPrice: 5500 },
  { id: 'mb-12', name: 'Termo de agua plástico de 3', category: 'Plásticos y Hogar', unit: 'Und', unitPrice: 1250 },
  { id: 'mb-13', name: 'Comedor de 4 sillas cristal', category: 'Comedores', unit: 'Juego', unitPrice: 19000 },
  { id: 'mb-14', name: 'Comedor de 6 sillas cristal', category: 'Comedores', unit: 'Juego', unitPrice: 24000 },
  { id: 'mb-15', name: 'Comedor madera de 6', category: 'Comedores', unit: 'Juego', unitPrice: 22000 },
  { id: 'mb-16', name: 'Comedor de 6 Alcatel', category: 'Comedores', unit: 'Juego', unitPrice: 11500 },
  { id: 'mb-17', name: 'Espaldar y cama', category: 'Muebles / Camas', unit: 'Juego', unitPrice: 25000 },
  { id: 'mb-18', name: 'Organizador plástico de loza', category: 'Plásticos y Hogar', unit: 'Und', unitPrice: 1200 },
  { id: 'mb-19', name: 'Licuadora colima acromada', category: 'Electrodomésticos', unit: 'Und', unitPrice: 4500 },
  { id: 'mb-20', name: 'Escurridor para plato home básico', category: 'Hogar', unit: 'Und', unitPrice: 1200 },
  { id: 'mb-21', name: 'Tanque gas 50 libra elite', category: 'Gas y Cocina', unit: 'Und', unitPrice: 5000 },
  { id: 'mb-22', name: 'Tanque gas 50 libras regular', category: 'Gas y Cocina', unit: 'Und', unitPrice: 3200 },
  { id: 'mb-23', name: 'Tanque gas 25 libras regular', category: 'Gas y Cocina', unit: 'Und', unitPrice: 2400 },
  { id: 'mb-24', name: 'Mueble bazuca de 2 gord', category: 'Muebles', unit: 'Juego', unitPrice: 13500 },
  { id: 'mb-25', name: 'Mueble bazuca de 3 gord', category: 'Muebles', unit: 'Juego', unitPrice: 16500 },
  { id: 'mb-26', name: 'Mueble tipo L', category: 'Muebles', unit: 'Juego', unitPrice: 22500 },
  { id: 'mb-27', name: 'Televisor discovery de 42 pulg', category: 'Televisores', unit: 'Und', unitPrice: 23500 },
  { id: 'mb-28', name: 'Televisor discovery 32 pulg', category: 'Televisores', unit: 'Und', unitPrice: 15500 },
  { id: 'mb-29', name: 'Biury plástico', category: 'Plásticos y Hogar', unit: 'Und', unitPrice: 3000 },
  { id: 'mb-30', name: 'Carretilla pequeña', category: 'Ferretería / Hogar', unit: 'Und', unitPrice: 5500 },
  { id: 'mb-31', name: 'Sillas con brazos', category: 'Plásticos y Muebles', unit: 'Und', unitPrice: 400 },
  { id: 'mb-32', name: 'Sillas plástica sin brazos', category: 'Plásticos y Muebles', unit: 'Und', unitPrice: 650 },
  { id: 'mb-33', name: 'Estufa discovery de 20', category: 'Estufas', unit: 'Und', unitPrice: 10500 },

  // Página 2 del PDF
  { id: 'mb-34', name: 'Estufa discovery de 30', category: 'Estufas', unit: 'Und', unitPrice: 25000 },
  { id: 'mb-35', name: 'Estufa nedoca de 20', category: 'Estufas', unit: 'Und', unitPrice: 19500 },
  { id: 'mb-36', name: 'Bocina a x 1000', category: 'Audio y Sonido', unit: 'Und', unitPrice: 19500 },
  { id: 'mb-37', name: 'Estufa superior 741 de 20', category: 'Estufas', unit: 'Und', unitPrice: 14000 },
  { id: 'mb-38', name: 'Estufa turbina de 20', category: 'Estufas', unit: 'Und', unitPrice: 10500 },
  { id: 'mb-39', name: 'Estufa de mesa', category: 'Estufas', unit: 'Und', unitPrice: 3500 },
  { id: 'mb-40', name: 'Abanico universal pedestal', category: 'Ventilación', unit: 'Und', unitPrice: 4000 },
  { id: 'mb-41', name: 'Nevera superior de 10 pie', category: 'Refrigeración', unit: 'Und', unitPrice: 25000 },
  { id: 'mb-42', name: 'Nevera superior 2205 de 8 pie', category: 'Refrigeración', unit: 'Und', unitPrice: 18000 },
  { id: 'mb-43', name: 'Mesa plástica', category: 'Plásticos y Muebles', unit: 'Und', unitPrice: 2500 },
  { id: 'mb-44', name: 'Licuadora discovery', category: 'Electrodomésticos', unit: 'Und', unitPrice: 4500 },
  { id: 'mb-45', name: 'FRICER SUPERIOR. N 5', category: 'Refrigeración', unit: 'Und', unitPrice: 17000 },
  { id: 'mb-46', name: 'FRICER SUPERIOR N 7', category: 'Refrigeración', unit: 'Und', unitPrice: 19000 },
  { id: 'mb-47', name: 'Lavadora daewoo dw5010 16lbr', category: 'Lavado', unit: 'Und', unitPrice: 14000 },
  { id: 'mb-48', name: 'Lavadora daewoo 1201 28lbr', category: 'Lavado', unit: 'Und', unitPrice: 19000 },
  { id: 'mb-49', name: 'Lavadora daewoo 1501 33lbr', category: 'Lavado', unit: 'Und', unitPrice: 21000 },
  { id: 'mb-50', name: 'Bocina a xt audio 1000wat', category: 'Audio y Sonido', unit: 'Und', unitPrice: 18000 },
  { id: 'mb-51', name: 'Silla ratán peque', category: 'Muebles', unit: 'Und', unitPrice: 750 },
  { id: 'mb-52', name: 'Silla ratan grande', category: 'Muebles', unit: 'Und', unitPrice: 1500 },
  { id: 'mb-53', name: 'Cubo 32gl jumbo', category: 'Plásticos y Hogar', unit: 'Und', unitPrice: 2500 },
  { id: 'mb-54', name: 'Cubo 20gl mediano', category: 'Plásticos y Hogar', unit: 'Und', unitPrice: 1400 }
];

export { INITIAL_CLIENTS } from './initialClients';
