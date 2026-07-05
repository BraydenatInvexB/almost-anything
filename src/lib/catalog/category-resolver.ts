import type { ProductCategory } from "@/types/database";
import { STORE_CATEGORIES } from "@/config/categories";

const VALID_SLUGS = new Set(STORE_CATEGORIES.map((c) => c.slug));

type CategoryRule = {
  slug: ProductCategory;
  patterns: RegExp[];
};

const CATEGORY_RULES: CategoryRule[] = [
  {
    slug: "garden",
    patterns: [
      /\bastro\b|\bturf\b|\bartificial.?grass|\bsynthetic.?grass|\bgrass mat|\blawn roll|\blandscap/i,
    ],
  },
  {
    slug: "phones",
    patterns: [
      /\biphone\b|\bipad\b|\bapple\s*watch\b|\bsamsung\b|\bpixel\b|\bphone\b|\bsmartphone\b|\btablet\b|\bgalaxy\s*tab\b/i,
    ],
  },
  {
    slug: "garden",
    patterns: [
      /\bscrew|\bbolt|\bnut\b|\bfastener|\bdrill|\bsocket|\bwrench|\btool\b|\bhardware|\bplier|\bspanner|\bhammer|\bsaw\b/i,
    ],
  },
  {
    slug: "garden",
    patterns: [/\bm2\b|\bm3\b(?!\s*max|\s*pro)\b|\bm5\b|\bm6\b/i],
  },
  {
    slug: "computers",
    patterns: [/\blaptop\b|\bmonitor\b|\bkeyboard\b|\bmouse\b|\bmacbook\b|\bpc\b/i],
  },
  {
    slug: "electronics",
    patterns: [/\belectronic|\bwatch\b|\bsmartwatch\b|\bcamera\b|\bcharger\b|\bcable\b/i],
  },
  {
    slug: "audio",
    patterns: [/\bheadphone|\bearbud|\bspeaker|\bairpod|\bheadset\b/i],
  },
  {
    slug: "furniture",
    patterns: [/\bsofa|\bcouch|\bsectional|\bchair|\btable|\bdesk|\bbed\b|\bwardrobe|\bdresser/i],
  },
  {
    slug: "kitchen",
    patterns: [/\bkitchen|\bcookware|\bpot\b|\bpan\b|\bknife|\bespresso|\bcoffee machine|\bblender/i],
  },
  {
    slug: "home",
    patterns: [/\blamp|\blight\b|\bdecor|\bcurtain|\bpillow|\bblanket|\brug\b/i],
  },
  {
    slug: "sleepwear",
    patterns: [
      /\bnight\s?gown|\bnightgown|\bsleepwear|\bpyjama|\bpajama|\bnightie|\bnightdress|\bchemise|\bloungewear|\brobe\b|\bsleep\s?dress/i,
    ],
  },
  {
    slug: "fashion",
    patterns: [/\bshirt|\bshoe|\bsneaker|\bdress|\bjacket|\bpants|\bjeans|\bhoodie/i],
  },
  {
    slug: "womens",
    patterns: [/\bwomen'?s?\b|\bladies'?\b|\blady'?s?\b|\bfemale\b/i],
  },
  {
    slug: "mens",
    patterns: [/\bmen'?s?\b|\bgentlemen|\bmenswear|\bmale\b/i],
  },
  {
    slug: "lingerie",
    patterns: [/\blingerie|\bunderwear|\bbra\b|\bbralette|\bpanties|\bbriefs|\bknickers/i],
  },
  {
    slug: "jewelry",
    patterns: [
      /\bjewelry|\bjewellery|\bnecklace|\bbracelet|\bearring|\bpendant|\bengagement ring|\bwedding ring/i,
    ],
  },
  {
    slug: "appliances",
    patterns: [
      /\bappliance|\bvacuum|\bkettle|\bmicrowave|\bair fryer|\bwashing machine|\btumble dryer|\bfridge|\brefrigerator|\bdishwasher/i,
    ],
  },
  {
    slug: "beauty",
    patterns: [/\bskincare|\bmakeup|\bperfume|\bshampoo|\bserum\b/i],
  },
  {
    slug: "sports",
    patterns: [/\bgym|\bfitness|\bdumbbell|\byoga|\brunning|\bsport/i],
  },
  {
    slug: "gaming",
    patterns: [/\bgame|\bconsole|\bplaystation|\bxbox|\bcontroller|\bgaming/i],
  },
  {
    slug: "toys",
    patterns: [/\btoy|\blego|\bdoll|\bpuzzle\b/i],
  },
  {
    slug: "pets",
    patterns: [/\bpet|\bdog|\bcat\b|\bleash|\bcollar\b/i],
  },
  {
    slug: "books",
    patterns: [/\bbook|\bnotebook|\bstationery|\bpen\b|\bjournal/i],
  },
  {
    slug: "travel",
    patterns: [
      /\btravel|\bluggage|\bsuitcase|\bbackpack|\bduffel|\bcabin bag|\btrolley bag|\bpassport|\bcarry.?on|\bweekender/i,
    ],
  },
  {
    slug: "automotive",
    patterns: [
      /\bautomotive|\bcar\b|\bvehicle|\btyre|\btire\b|\bmotor(?:cycle|bike)|\bdash\s*cam|\bbrake pad|\boil filter|\bnumber plate/i,
    ],
  },
  {
    slug: "health",
    patterns: [
      /\bvitamin|\bsupplement|\bmedical|\bfirst aid|\bthermometer|\bwheelchair|\bmobility|\bhealth\b|\bwellness\b|\bglucose|\bblood pressure/i,
    ],
  },
  {
    slug: "baby",
    patterns: [
      /\bbaby|\binfant|\bstroller|\bpram|\bdiaper|\bnappy|\bnursery|\btoddler|\bhigh chair|\bbottle warmer/i,
    ],
  },
  {
    slug: "office",
    patterns: [
      /\boffice|\bprinter|\btoner|\bstapler|\bfiling cabinet|\bpencil case|\bdesk chair|\bwhiteboard|\blaminator/i,
    ],
  },
];

const LEGACY_MAP: Record<string, ProductCategory> = {
  sofa: "furniture",
  chair: "furniture",
  table: "furniture",
  bed: "furniture",
  dressers: "furniture",
  lamps: "home",
};

export function resolveProductCategory(
  query: string,
  productName: string,
  hint?: string,
): ProductCategory {
  const text = `${query} ${productName} ${hint ?? ""}`.toLowerCase();

  if (hint && VALID_SLUGS.has(hint as ProductCategory)) {
    return hint as ProductCategory;
  }

  if (hint && LEGACY_MAP[hint]) {
    return LEGACY_MAP[hint];
  }

  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((p) => p.test(text))) {
      return rule.slug;
    }
  }

  return "general";
}
