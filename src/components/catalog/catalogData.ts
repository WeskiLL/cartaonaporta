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
import tagGravata from "@/assets/catalog/tag-gravata.jpeg";

// Kits
import kitEmpreendedor from "@/assets/catalog/kit-empreendedor-iniciante.jpeg";
import kitEmpreendedor100 from "@/assets/catalog/kit-empreendedor-100.jpeg";

// Cartões
import miniCertificado from "@/assets/catalog/mini-certificado-garantia.jpeg";
import certificadoGarantia from "@/assets/catalog/certificado-garantia.jpeg";

// Adesivos
import tagAdesivaAnel from "@/assets/catalog/tag-adesiva-anel.jpeg";

export interface Product {
  id: string;
  name: string;
  size: string;
  image: string;
  category: "tags" | "kits" | "cartoes" | "adesivos" | "outros";
  isKit?: boolean; // Para kits que não têm seleção de quantidade
  kitDescription?: string; // Descrição do conteúdo do kit
  availableQuantities?: number[]; // Quantidades disponíveis (se diferente do padrão)
  customSpecs?: string[]; // Especificações customizadas (ex: ["Couchê 90g"])
  prices: {
    qty100?: number;
    qty200?: number;
    qty250?: number;
    qty500?: number;
    qty1000?: number;
    qty2000?: number;
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
      qty100: 0,
      qty250: 0,
      qty500: 0,
      qty1000: 0,
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
  {
    id: "tag-gravata",
    name: "Tag gravata",
    size: "5x13",
    image: tagGravata,
    category: "tags",
    availableQuantities: [500, 1000], // Somente 500 e 1000
    prices: {
      qty500: 0,
      qty1000: 0,
    },
  },

  // ===== KITS =====
  {
    id: "kit-empreendedor-iniciante",
    name: "Kit Empreendedor Iniciante",
    size: "Vários tamanhos",
    image: kitEmpreendedor,
    category: "kits",
    isKit: true,
    kitDescription: "200un Mini certificado de garantia + 100un Tag colar e brinco (9x5) + 100un Tag trio de brincos (4x5)",
    prices: {
      qty100: 0, // Preço único do kit
    },
  },
  {
    id: "kit-empreendedor-100",
    name: "Kit Empreendedor Iniciante 100 unidades",
    size: "Vários tamanhos",
    image: kitEmpreendedor100,
    category: "kits",
    isKit: true,
    kitDescription: "Tag para colar e trio de brincos (9x5) + Tag trio de brincos (4x5)",
    prices: {
      qty100: 0, // Preço único do kit
    },
  },

  // ===== CARTÕES =====
  {
    id: "mini-certificado-garantia",
    name: "Mini certificado de garantia",
    size: "4,5x5",
    image: miniCertificado,
    category: "cartoes",
    prices: {
      qty100: 0,
      qty250: 0,
      qty500: 0,
      qty1000: 0,
    },
  },
  {
    id: "certificado-garantia",
    name: "Certificado de garantia",
    size: "5x9",
    image: certificadoGarantia,
    category: "cartoes",
    prices: {
      qty100: 0,
      qty250: 0,
      qty500: 0,
      qty1000: 0,
    },
  },

  // ===== ADESIVOS =====
  {
    id: "tag-adesiva-anel",
    name: "Tag adesiva para anel",
    size: "7x4",
    image: tagAdesivaAnel,
    category: "adesivos",
    availableQuantities: [250, 500, 1000], // A partir de 250
    customSpecs: ["Frente e Verso", "Couchê 90g"],
    prices: {
      qty250: 0,
      qty500: 0,
      qty1000: 0,
    },
  },

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
