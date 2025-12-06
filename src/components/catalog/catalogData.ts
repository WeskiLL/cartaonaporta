// Catalog product images
import tagTrioArgolas from "@/assets/catalog/tag-trio-argolas.jpeg";
import tagTrioBrincosColar from "@/assets/catalog/tag-trio-brincos-colar.jpeg";
import tagColarPulseira from "@/assets/catalog/tag-colar-pulseira.jpeg";
import tagBrincoColar from "@/assets/catalog/tag-brinco-colar.jpeg";
import tagAnel1 from "@/assets/catalog/tag-anel-1.jpeg";
import tagCapelinha from "@/assets/catalog/tag-capelinha.jpeg";
import tagAnel2 from "@/assets/catalog/tag-anel-2.jpeg";
import tagBrincos1 from "@/assets/catalog/tag-brincos-1.jpeg";
import tagBrincos2 from "@/assets/catalog/tag-brincos-2.jpeg";
import tagBrincos3 from "@/assets/catalog/tag-brincos-3.jpeg";

export interface Product {
  id: string;
  name: string;
  size: string;
  image: string;
  category: "tags" | "kits" | "cartoes" | "adesivos" | "outros";
  prices: {
    qty100: number;
    qty250: number;
    qty500: number;
    qty1000: number;
  };
}

// PREÇOS: Edite os valores abaixo conforme necessário
// Se o valor for 0, aparecerá "Consultar" no lugar do preço
export const products: Product[] = [
  // ===== TAGS =====
  {
    id: "tag-trio-argolas",
    name: "Tag trio de argolas",
    size: "7x4",
    image: tagTrioArgolas,
    category: "tags",
    prices: {
      qty100: 0,  // Editar preço
      qty250: 0,  // Editar preço
      qty500: 0,  // Editar preço
      qty1000: 0, // Editar preço
    },
  },
  {
    id: "tag-trio-brincos-colar",
    name: "Tag para trio de brincos e colar",
    size: "5x9",
    image: tagTrioBrincosColar,
    category: "tags",
    prices: {
      qty100: 0,
      qty250: 0,
      qty500: 0,
      qty1000: 0,
    },
  },
  {
    id: "tag-colar-pulseira",
    name: "Tag para colar / pulseira",
    size: "5x9",
    image: tagColarPulseira,
    category: "tags",
    prices: {
      qty100: 0,
      qty250: 0,
      qty500: 0,
      qty1000: 0,
    },
  },
  {
    id: "tag-brinco-colar",
    name: "Tag para brinco e colar",
    size: "5x9",
    image: tagBrincoColar,
    category: "tags",
    prices: {
      qty100: 0,
      qty250: 0,
      qty500: 0,
      qty1000: 0,
    },
  },
  {
    id: "tag-anel-1",
    name: "Tag para anel",
    size: "6,5x2,3",
    image: tagAnel1,
    category: "tags",
    prices: {
      qty100: 0,
      qty250: 0,
      qty500: 0,
      qty1000: 0,
    },
  },
  {
    id: "tag-capelinha",
    name: "Tag Capelinha",
    size: "4x5",
    image: tagCapelinha,
    category: "tags",
    prices: {
      qty100: 0,
      qty250: 0,
      qty500: 0,
      qty1000: 0,
    },
  },
  {
    id: "tag-anel-2",
    name: "Tag para anel",
    size: "4x5",
    image: tagAnel2,
    category: "tags",
    prices: {
      qty100: 0,
      qty250: 0,
      qty500: 0,
      qty1000: 0,
    },
  },
  {
    id: "tag-brincos-1",
    name: "Tag para brincos",
    size: "4x5",
    image: tagBrincos1,
    category: "tags",
    prices: {
      qty100: 0,
      qty250: 0,
      qty500: 0,
      qty1000: 0,
    },
  },
  {
    id: "tag-brincos-2",
    name: "Tag para brincos",
    size: "4x5",
    image: tagBrincos2,
    category: "tags",
    prices: {
      qty100: 0,
      qty250: 0,
      qty500: 0,
      qty1000: 0,
    },
  },
  {
    id: "tag-brincos-3",
    name: "Tag para brincos",
    size: "4x5",
    image: tagBrincos3,
    category: "tags",
    prices: {
      qty100: 0,
      qty250: 0,
      qty500: 0,
      qty1000: 0,
    },
  },

  // ===== KITS =====
  // Adicione produtos de kits aqui quando tiver as imagens

  // ===== CARTÕES =====
  // Adicione cartões aqui quando tiver as imagens

  // ===== ADESIVOS =====
  // Adicione adesivos aqui quando tiver as imagens

  // ===== OUTROS =====
  // Adicione outros produtos aqui quando tiver as imagens
];

export const categories = [
  { id: "tags", label: "Tags" },
  { id: "kits", label: "Kits" },
  { id: "cartoes", label: "Cartões" },
  { id: "adesivos", label: "Adesivos" },
  { id: "outros", label: "Outros" },
] as const;
