"""
Idempotent seed of technologies, materials and portfolio projects.

Records are matched by slug, so running the command repeatedly updates the
existing rows instead of creating duplicates. Customer submissions
(quotes / modeling requests) are never touched.
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from printing.models import PortfolioProject, PrintMaterial, PrintTechnology


def unsplash(photo_id: str) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w=1400&q=80"


TECHNOLOGIES = [
    {
        "slug": "fdm",
        "name": "FDM / FFF (Priemyselná termoplastická tlač)",
        "short_summary": (
            "Vrstvová tlač z technických termoplastov – najrýchlejšia a cenovo najefektívnejšia "
            "cesta k funkčným prototypom, prípravkom a malosériovým dielom. Pracujeme s "
            "uzavretými vyhrievanými komorami pre rozmerovo stabilné ASA, PA a kompozity."
        ),
        "tolerance_label": "± 0.20 mm",
        "max_build_volume": "350 × 350 × 350 mm",
        "min_layer_height": "0.08 mm",
        "typical_lead_time": "2 – 4 pracovné dni",
        "icon_name": "fdm",
        "display_order": 1,
    },
    {
        "slug": "sla",
        "name": "SLA / MSLA (Vysokopresná živicová tlač)",
        "short_summary": (
            "Vytvrdzovanie fotopolymérnej živice UV svetlom s rozlíšením až 25 µm. Ideálne "
            "pre detailné vizuálne modely, presné zostavy, zubné a zdravotnícke prototypy či "
            "master modely na odlievanie do silikónu."
        ),
        "tolerance_label": "± 0.05 mm",
        "max_build_volume": "218 × 123 × 260 mm",
        "min_layer_height": "0.025 mm",
        "typical_lead_time": "2 – 3 pracovné dni",
        "icon_name": "sla",
        "display_order": 2,
    },
    {
        "slug": "sls",
        "name": "SLS (Laserové spekanie polyamidov PA12)",
        "short_summary": (
            "Laser speká prášok PA12 bez potreby podpôr, takže vyrobíme aj zložité geometrie, "
            "pohyblivé zostavy a desiatky dielov naraz. Izotropné mechanické vlastnosti blízke "
            "vstrekovaným dielom – pre náročnú malosériovú výrobu."
        ),
        "tolerance_label": "± 0.10 mm",
        "max_build_volume": "300 × 300 × 300 mm",
        "min_layer_height": "0.10 mm",
        "typical_lead_time": "4 – 6 pracovných dní",
        "icon_name": "sls",
        "display_order": 3,
    },
]


MATERIALS = [
    {
        "slug": "pla-pro",
        "technology": "fdm",
        "name": "PLA Pro (Biopolymér pre prototypy)",
        "short_description": (
            "Rozmerovo presný a cenovo dostupný materiál pre koncepčné modely, makety a rýchle "
            "overenie tvaru."
        ),
        "detailed_description": (
            "PLA Pro je modifikovaná kyselina polymliečna so zvýšenou húževnatosťou oproti "
            "bežnému PLA. Tlačí sa s minimálnou deformáciou, dosahuje ostré hrany a čistý "
            "povrch. Hodí sa na vizuálne prototypy, ergonomické makety, prezentačné modely a "
            "diely, ktoré nebudú vystavené teplotám nad 55 °C. Materiál je vyrobený z "
            "obnoviteľných zdrojov."
        ),
        "properties_tags": [
            "Vysoká rozmerová presnosť",
            "Najnižšia cena",
            "Ostré detaily",
            "Biopolymér",
        ],
        "applications": [
            "Koncepčné a vizuálne prototypy",
            "Ergonomické makety",
            "Prezentačné a výstavné modely",
            "Kontrolné kalibre s nízkym zaťažením",
        ],
        "available_colors": ["Matná čierna", "Technická sivá", "Biela", "Oranžová", "Modrá"],
        "price_per_gram_eur": Decimal("0.120"),
        "setup_fee_eur": Decimal("5.00"),
        "tensile_strength_mpa": 60,
        "max_temp_celsius": 55,
        "density_g_cm3": Decimal("1.24"),
        "is_featured": True,
        "display_order": 1,
    },
    {
        "slug": "petg",
        "technology": "fdm",
        "name": "PETG (Mechanicky a chemicky odolný)",
        "short_description": (
            "Húževnatý konštrukčný plast s dobrou chemickou odolnosťou pre funkčné diely a kryty."
        ),
        "detailed_description": (
            "PETG kombinuje pevnosť, mierne pruženie a výbornú medzivrstvovú adhéziu. Odoláva "
            "olejom, slabým kyselinám a zásadám a je vhodný aj na diely v kontakte s vodou. "
            "Odporúčame ho na funkčné kryty, držiaky, upínacie prvky a diely, ktoré musia "
            "zniesť nárazy bez krehkého lomu."
        ),
        "properties_tags": [
            "Chemická odolnosť",
            "Húževnatosť",
            "Teplotná odolnosť do 75 °C",
            "Vhodný pre kontakt s vodou",
        ],
        "applications": [
            "Kryty elektroniky",
            "Funkčné držiaky a konzoly",
            "Prípravky do výroby",
            "Diely pre vlhké prostredie",
        ],
        "available_colors": ["Matná čierna", "Technická sivá", "Biela", "Transparentná"],
        "price_per_gram_eur": Decimal("0.140"),
        "setup_fee_eur": Decimal("6.00"),
        "tensile_strength_mpa": 50,
        "max_temp_celsius": 75,
        "density_g_cm3": Decimal("1.27"),
        "is_featured": True,
        "display_order": 2,
    },
    {
        "slug": "asa-abs",
        "technology": "fdm",
        "name": "ASA / ABS (UV stabilný pre exteriér)",
        "short_description": (
            "Teplotne a UV odolný technický plast pre exteriérové kryty a diely v automotive."
        ),
        "detailed_description": (
            "ASA je nástupca ABS s výrazne vyššou odolnosťou voči UV žiareniu a poveternostným "
            "vplyvom – nežltne a nekrehne ani po rokoch vonku. Tlačíme ho v uzavretej "
            "vyhrievanej komore, vďaka čomu sú diely rozmerovo stabilné aj vo väčších "
            "rozmeroch. Povrch je možné ďalej brúsiť, lakovať alebo vyhladiť acetónovými parami."
        ),
        "properties_tags": [
            "UV stabilita",
            "Teplotná odolnosť do 95 °C",
            "Odolnosť voči poveternostným vplyvom",
            "Vhodný na lakovanie",
        ],
        "applications": [
            "Exteriérové kryty senzorov",
            "Diely interiéru vozidiel",
            "Kryty elektroinštalácií",
            "Malosériové koncové diely",
        ],
        "available_colors": ["Matná čierna", "Technická sivá", "Biela", "Oranžová"],
        "price_per_gram_eur": Decimal("0.160"),
        "setup_fee_eur": Decimal("6.00"),
        "tensile_strength_mpa": 48,
        "max_temp_celsius": 95,
        "density_g_cm3": Decimal("1.07"),
        "is_featured": True,
        "display_order": 3,
    },
    {
        "slug": "pa12-cf",
        "technology": "fdm",
        "name": "PA12 Carbon Fiber (Konštrukčný nylon s uhlíkom)",
        "short_description": (
            "Nylon vystužený uhlíkovými vláknami – tuhosť a pevnosť pre náhradu hliníkových dielov."
        ),
        "detailed_description": (
            "PA12-CF obsahuje 15 % krátkych uhlíkových vlákien, ktoré výrazne zvyšujú tuhosť a "
            "rozmerovú stabilitu pri zachovaní nízkej hmotnosti. Matný povrch s minimálne "
            "viditeľnými vrstvami pôsobí profesionálne. Materiál je vhodný na funkčné "
            "prototypy prevodov, upínacie prípravky, koncové efektory robotov a diely "
            "vystavené dlhodobému mechanickému zaťaženiu."
        ),
        "properties_tags": [
            "Uhlíkové vlákno",
            "Vysoká pevnosť v ťahu",
            "Vysoká tuhosť",
            "Teplotná odolnosť do 140 °C",
        ],
        "applications": [
            "Upínacie prípravky a prípravky CNC",
            "Koncové efektory robotov",
            "Funkčné prototypy prevodoviek",
            "Náhrada obrábaných hliníkových dielov",
        ],
        "available_colors": ["Matná čierna"],
        "price_per_gram_eur": Decimal("0.380"),
        "setup_fee_eur": Decimal("9.00"),
        "tensile_strength_mpa": 85,
        "max_temp_celsius": 140,
        "density_g_cm3": Decimal("1.08"),
        "is_featured": True,
        "display_order": 4,
    },
    {
        "slug": "tpu-95a",
        "technology": "fdm",
        "name": "TPU 95A (Flexibilný elastomér)",
        "short_description": (
            "Pružný gumový materiál pre tesnenia, tlmiče, úchopy a ochranné prvky."
        ),
        "detailed_description": (
            "Termoplastický polyuretán s tvrdosťou Shore 95A sa správa ako tvrdšia guma – je "
            "odolný voči oderu, olejom a opakovanému ohybu. Používame ho na tlmiace podložky, "
            "ochranné nárazníky, mäkké čeľuste do zveráka, tesnenia s nízkym tlakom a "
            "ergonomické úchopy."
        ),
        "properties_tags": [
            "Flexibilita Shore 95A",
            "Odolnosť voči oderu",
            "Tlmenie vibrácií",
            "Odolnosť voči olejom",
        ],
        "applications": [
            "Tlmiace podložky a dorazy",
            "Mäkké čeľuste a úchopy",
            "Ochranné kryty a nárazníky",
            "Nízkotlakové tesnenia",
        ],
        "available_colors": ["Matná čierna", "Biela", "Oranžová", "Transparentná"],
        "price_per_gram_eur": Decimal("0.220"),
        "setup_fee_eur": Decimal("7.00"),
        "tensile_strength_mpa": 35,
        "max_temp_celsius": 80,
        "density_g_cm3": Decimal("1.21"),
        "is_featured": False,
        "display_order": 5,
    },
    {
        "slug": "engineering-tough-resin",
        "technology": "sla",
        "name": "Engineering Tough Resin (SLA)",
        "short_description": (
            "Húževnatá technická živica s vlastnosťami podobnými ABS a hladkým povrchom bez vrstiev."
        ),
        "detailed_description": (
            "Technická živica navrhnutá pre presné funkčné prototypy, ktoré musia zniesť "
            "montáž, zacvaknutie a opakované zaťaženie. Dosahuje tolerancie ± 0.05 mm a "
            "povrch pripravený na lakovanie bez ďalšieho brúsenia. Ideálna pre zostavy "
            "s malými vôľami, kryty s klipmi a presné mechanické komponenty."
        ),
        "properties_tags": [
            "Hladký povrch bez vrstiev",
            "Presnosť ± 0.05 mm",
            "Húževnatosť podobná ABS",
            "Jemné detaily do 0.2 mm",
        ],
        "applications": [
            "Presné funkčné zostavy",
            "Kryty so zacvakávacími spojmi",
            "Master modely na odlievanie",
            "Prototypy spotrebnej elektroniky",
        ],
        "available_colors": ["Technická sivá", "Matná čierna", "Biela"],
        "price_per_gram_eur": Decimal("0.320"),
        "setup_fee_eur": Decimal("8.00"),
        "tensile_strength_mpa": 55,
        "max_temp_celsius": 60,
        "density_g_cm3": Decimal("1.15"),
        "is_featured": True,
        "display_order": 1,
    },
    {
        "slug": "clear-resin-sla",
        "technology": "sla",
        "name": "Clear Resin (Transparentná optická živica)",
        "short_description": (
            "Číra živica pre svetlovody, prietokové modely a vizualizáciu vnútorných kanálov."
        ),
        "detailed_description": (
            "Transparentná fotopolymérna živica, ktorá po prebrúsení a lakovaní dosahuje "
            "takmer sklenú priehľadnosť. Využíva sa na svetlovody, kryty LED, mikrofluidné a "
            "prietokové modely a na prezentáciu vnútorných mechanizmov produktov."
        ),
        "properties_tags": [
            "Transparentnosť",
            "Hladký povrch bez vrstiev",
            "Vhodná na leštenie",
            "Jemné detaily",
        ],
        "applications": [
            "Svetlovody a kryty LED",
            "Prietokové a mikrofluidné modely",
            "Vizualizácia vnútorných kanálov",
            "Dizajnové prototypy",
        ],
        "available_colors": ["Transparentná"],
        "price_per_gram_eur": Decimal("0.300"),
        "setup_fee_eur": Decimal("8.00"),
        "tensile_strength_mpa": 65,
        "max_temp_celsius": 70,
        "density_g_cm3": Decimal("1.18"),
        "is_featured": False,
        "display_order": 2,
    },
    {
        "slug": "pa12-sintered-nylon",
        "technology": "sls",
        "name": "PA12 Sintered Nylon (SLS)",
        "short_description": (
            "Priemyselný polyamid pre koncové diely, pohyblivé zostavy a sériovú výrobu bez foriem."
        ),
        "detailed_description": (
            "PA12 spekaný laserom vytvára izotropné diely s mechanickými vlastnosťami "
            "porovnateľnými so vstrekovaným plastom. Keďže proces nepotrebuje podpory, "
            "dokážeme tlačiť zložité tvary, integrované pánty aj vnorené zostavy a efektívne "
            "naskladať desiatky kusov do jednej výrobnej dávky. Povrch je jemne matný, "
            "na požiadanie ho farbíme na čierno alebo tryskáme."
        ),
        "properties_tags": [
            "Izotropné vlastnosti",
            "Bez podpôr – voľná geometria",
            "Vysoká pevnosť v ťahu",
            "Teplotná odolnosť do 150 °C",
        ],
        "applications": [
            "Malosériové koncové diely",
            "Pohyblivé zostavy a pánty",
            "Potrubia a vzduchovody",
            "Ortézy a zdravotnícke pomôcky",
        ],
        "available_colors": ["Biela", "Matná čierna"],
        "price_per_gram_eur": Decimal("0.420"),
        "setup_fee_eur": Decimal("12.00"),
        "tensile_strength_mpa": 48,
        "max_temp_celsius": 150,
        "density_g_cm3": Decimal("1.01"),
        "is_featured": True,
        "display_order": 1,
    },
]


PROJECTS = [
    {
        "slug": "maloseriova-vyroba-250-ks-senzorovych-krytov-z-asa",
        "title": "Malosériová výroba 250 ks senzorových krytov z ASA",
        "technology": "fdm",
        "material": "asa-abs",
        "client_sector": "Elektrotechnika",
        "challenge_summary": (
            "Výrobca IoT meteostaníc potreboval pre pilotnú sériu exteriérové kryty skôr, než "
            "bude hotová vstrekovacia forma. Upravili sme konštrukciu pre FDM tlač, doplnili "
            "zalisované mosadzné vložky M3 a dodali 250 UV stabilných kusov v dvoch dávkach."
        ),
        "production_specs": "Výška vrstvy 0.20 mm, 40 % výplň gyroid, zalisované vložky M3, dodanie do 6 dní",
        "quantity_produced": 250,
        "image_url": unsplash("1611117775350-ac3950990985"),
        "is_featured": True,
        "display_order": 1,
    },
    {
        "slug": "funkcny-prototyp-prevodovky-z-pa12-cf",
        "title": "Funkčný prototyp prevodovky z PA12-CF",
        "technology": "fdm",
        "material": "pa12-cf",
        "client_sector": "Automotive & Priemysel",
        "challenge_summary": (
            "Konštrukčný tím vývojára pohonov potreboval overiť zábery ozubených kolies a "
            "montáž skrine pred objednaním obrábaných dielov. Kompozit s uhlíkom zvládol "
            "skúšobný chod pod zaťažením a ušetril klientovi tri týždne vývoja."
        ),
        "production_specs": "Výška vrstvy 0.12 mm, 100 % výplň ozubení, tolerancia uloženia ± 0.10 mm, dodanie do 4 dní",
        "quantity_produced": 3,
        "image_url": unsplash("1563520239648-a24e51d4b570"),
        "is_featured": True,
        "display_order": 2,
    },
    {
        "slug": "architektonicky-model-bytoveho-komplexu-1-100",
        "title": "Architektonický model bytového komplexu 1:100",
        "technology": "sla",
        "material": "engineering-tough-resin",
        "client_sector": "Architektúra & Dizajn",
        "challenge_summary": (
            "Developerský projekt potreboval presný prezentačný model na predajné centrum. "
            "Model sme rozdelili na 18 segmentov, vytlačili v SLA s detailmi zábradlí 0.3 mm "
            "a po zlepení nastriekali matnou bielou s osvetlením vnútorných podlaží."
        ),
        "production_specs": "Výška vrstvy 0.05 mm, 18 segmentov, brúsenie a lakovanie, dodanie do 8 dní",
        "quantity_produced": 1,
        "image_url": unsplash("1487958449943-2429e8be8625"),
        "is_featured": True,
        "display_order": 3,
    },
    {
        "slug": "sada-ergonomickych-pripravkov-pre-vyrobnu-linku",
        "title": "Sada ergonomických prípravkov pre výrobnú linku",
        "technology": "fdm",
        "material": "petg",
        "client_sector": "Automotive & Priemysel",
        "challenge_summary": (
            "Dodávateľ automobilového priemyslu hľadal lacnejšiu alternatívu k frézovaným "
            "montážnym prípravkom. Navrhli sme 14 polohovacích a kontrolných prípravkov, ktoré "
            "skrátili čas montáže o 22 % a znížili náklady oproti hliníku o viac ako 70 %."
        ),
        "production_specs": "Výška vrstvy 0.20 mm, 50 % výplň, TPU mäkké dorazy, dodanie do 5 dní",
        "quantity_produced": 14,
        "image_url": unsplash("1647427060118-4911c9821b82"),
        "is_featured": True,
        "display_order": 4,
    },
    {
        "slug": "prototypy-krytu-diagnostickeho-pristroja",
        "title": "Prototypy krytu diagnostického prístroja",
        "technology": "sla",
        "material": "engineering-tough-resin",
        "client_sector": "Zdravotníctvo & Prototypy",
        "challenge_summary": (
            "Startup z oblasti medicínskej diagnostiky potreboval tri iterácie krytu so "
            "zacvakávacími spojmi pre klinické testovanie. Každú iteráciu sme dodali do 72 "
            "hodín, vrátane povrchovej úpravy pripravenej na prezentáciu investorom."
        ),
        "production_specs": "Výška vrstvy 0.05 mm, tolerancia ± 0.05 mm, lakovanie RAL 9003, dodanie do 3 dní",
        "quantity_produced": 9,
        "image_url": unsplash("1581093450021-4a7360e9a6b5"),
        "is_featured": True,
        "display_order": 5,
    },
    {
        "slug": "nahradne-diely-pre-baliacu-linku-z-pa12",
        "title": "Náhradné diely pre baliacu linku z PA12",
        "technology": "sls",
        "material": "pa12-sintered-nylon",
        "client_sector": "Automotive & Priemysel",
        "challenge_summary": (
            "Výrobcovi potravín sa zastavila linka kvôli prasknutému vodiacemu dielu, ktorý "
            "už nebol dostupný. Diel sme 3D naskenovali, zrekonštruovali v CAD a v SLS "
            "vyrobili 40 kusov ako dlhodobú zásobu náhradných dielov."
        ),
        "production_specs": "Výška vrstvy 0.10 mm, plný SLS diel, čierne farbenie, dodanie do 5 dní",
        "quantity_produced": 40,
        "image_url": unsplash("1567789884554-0b844b597180"),
        "is_featured": False,
        "display_order": 6,
    },
]


class Command(BaseCommand):
    help = "Naplní databázu technológiami, materiálmi a ukážkovými realizáciami (idempotentne)."

    @transaction.atomic
    def handle(self, *args, **options):
        technologies: dict[str, PrintTechnology] = {}
        for data in TECHNOLOGIES:
            data = dict(data)
            slug = data.pop("slug")
            obj, created = PrintTechnology.objects.update_or_create(slug=slug, defaults=data)
            technologies[slug] = obj
            self._report("Technológia", obj, created)

        materials: dict[str, PrintMaterial] = {}
        for data in MATERIALS:
            data = dict(data)
            slug = data.pop("slug")
            data["technology"] = technologies[data["technology"]]
            obj, created = PrintMaterial.objects.update_or_create(slug=slug, defaults=data)
            materials[slug] = obj
            self._report("Materiál", obj, created)

        for data in PROJECTS:
            data = dict(data)
            slug = data.pop("slug")
            data["technology"] = technologies[data["technology"]]
            data["material"] = materials.get(data["material"]) if data["material"] else None
            obj, created = PortfolioProject.objects.update_or_create(slug=slug, defaults=data)
            self._report("Realizácia", obj, created)

        self.stdout.write(
            self.style.SUCCESS(
                f"Hotovo: {len(TECHNOLOGIES)} technológie, {len(MATERIALS)} materiálov, "
                f"{len(PROJECTS)} realizácií."
            )
        )

    def _report(self, label: str, obj, created: bool) -> None:
        action = "vytvorená" if created else "aktualizovaná"
        self.stdout.write(f"  {label} {action}: {obj}")
