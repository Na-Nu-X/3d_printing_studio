/**
 * White-label configuration.
 *
 * Every studio-specific detail (brand, contacts, legal identifiers, machine
 * capabilities, social links, trust metrics, testimonials) lives here so the
 * whole site can be rebranded for a new client by editing this one file plus,
 * optionally, the color tokens in `src/styles/_variables.scss`.
 */

export interface OpeningHours {
  readonly days: string;
  readonly hours: string;
}

export interface SocialLink {
  readonly label: string;
  readonly url: string;
  readonly icon: 'linkedin' | 'instagram' | 'facebook' | 'youtube';
}

export interface TrustMetric {
  readonly value: string;
  readonly label: string;
}

export interface Testimonial {
  readonly quote: string;
  readonly author: string;
  readonly role: string;
  readonly company: string;
}

export interface SiteConfig {
  readonly studioName: string;
  readonly wordmark: { readonly primary: string; readonly secondary: string };
  readonly tagline: string;
  readonly description: string;
  readonly contact: {
    readonly phone: string;
    readonly phoneHref: string;
    readonly email: string;
    readonly responseTime: string;
  };
  readonly address: {
    readonly street: string;
    readonly city: string;
    readonly zip: string;
    readonly country: string;
    readonly mapUrl: string;
  };
  readonly pickupHours: readonly OpeningHours[];
  readonly legal: {
    readonly companyName: string;
    readonly ico: string;
    readonly dic: string;
    readonly icDph: string;
    readonly register: string;
  };
  readonly capabilities: {
    readonly maxBuildVolume: string;
    readonly bestTolerance: string;
    readonly minLayerHeight: string;
    readonly expressTurnaround: string;
    readonly maxFileSizeMb: number;
  };
  readonly fileFormats: readonly string[];
  readonly uploadAccept: string;
  readonly social: readonly SocialLink[];
  readonly trustMetrics: readonly TrustMetric[];
  readonly testimonials: readonly Testimonial[];
}

export const SITE_CONFIG: SiteConfig = {
  studioName: 'Vrstva 3D Studio',
  wordmark: { primary: 'VRSTVA', secondary: '3D studio' },
  tagline: 'Zákazková 3D tlač a malosériová výroba',
  description:
    'Priemyselná 3D tlač FDM, SLA a SLS, 3D modelovanie a reverzné inžinierstvo. ' +
    'Funkčné prototypy, náhradné diely a malé série s presnosťou až ± 0.05 mm.',
  contact: {
    phone: '+421 900 123 456',
    phoneHref: 'tel:+421900123456',
    email: 'dopyty@vrstva3d.sk',
    responseTime: 'Cenovú ponuku posielame do 24 hodín v pracovné dni.',
  },
  address: {
    street: 'Priemyselná 14',
    city: 'Bratislava',
    zip: '821 09',
    country: 'Slovensko',
    mapUrl: 'https://maps.google.com/?q=Priemyseln%C3%A1+14,+821+09+Bratislava',
  },
  pickupHours: [
    { days: 'Pondelok – Piatok', hours: '8:00 – 17:00' },
    { days: 'Sobota', hours: 'po dohode' },
    { days: 'Nedeľa', hours: 'zatvorené' },
  ],
  legal: {
    companyName: 'Vrstva 3D s.r.o.',
    ico: '12 345 678',
    dic: '2123456789',
    icDph: 'SK2123456789',
    register: 'Zapísaná v OR Mestského súdu Bratislava III, oddiel Sro, vložka č. 000000/B',
  },
  capabilities: {
    maxBuildVolume: '350 × 350 × 350 mm',
    bestTolerance: '± 0.05 mm',
    minLayerHeight: '0.025 mm',
    expressTurnaround: '48 hodín',
    maxFileSizeMb: 50,
  },
  fileFormats: ['.STL', '.STEP', '.3MF', '.OBJ'],
  uploadAccept: '.stl,.step,.stp,.3mf,.obj,.zip',
  social: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/', icon: 'linkedin' },
    { label: 'Instagram', url: 'https://www.instagram.com/', icon: 'instagram' },
    { label: 'YouTube', url: 'https://www.youtube.com/', icon: 'youtube' },
  ],
  trustMetrics: [
    { value: '12 400+', label: 'vyrobených dielov' },
    { value: '± 0.05 mm', label: 'presnosť SLA tlače' },
    { value: '48 h', label: 'expresné dodanie' },
    { value: '320+', label: 'B2B klientov' },
  ],
  testimonials: [
    {
      quote:
        'Pilotnú sériu 250 krytov sme mali do týždňa, s presne zalisovanými závitmi. ' +
        'Forma na vstrekovanie by nás stála 14 000 € a dva mesiace čakania.',
      author: 'Ing. Martin H.',
      role: 'vedúci vývoja',
      company: 'výrobca IoT senzoriky',
    },
    {
      quote:
        'Oceňujem technickú spätnú väzbu ešte pred tlačou – upozornili nás na tenké steny ' +
        'a navrhli lepšiu orientáciu dielu. Prototyp prevodovky fungoval na prvý pokus.',
      author: 'Ing. Zuzana K.',
      role: 'konštruktérka',
      company: 'dodávateľ pre automotive',
    },
    {
      quote:
        'Spoľahlivý partner pre náhradné diely, ktoré sa už nedajú kúpiť. Naskenujú, ' +
        'domodelujú a vyrobia – linka nám stála menej než 3 dni.',
      author: 'Peter M.',
      role: 'vedúci údržby',
      company: 'potravinársky závod',
    },
  ],
};
