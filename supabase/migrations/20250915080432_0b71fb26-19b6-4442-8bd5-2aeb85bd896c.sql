-- Add major cities from developed countries in Europe, Asia, and other regions

-- European Countries and Major Cities
-- United Kingdom (already exists, adding more cities)
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
-- UK Cities (parent_id will be updated after finding UK id)
('Edinburgh', 'EDI', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'UK' AND level = 'province')),
('Manchester', 'MAN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'UK' AND level = 'province')),
('Birmingham', 'BIR', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'UK' AND level = 'province')),
('Glasgow', 'GLA', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'UK' AND level = 'province')),
('Liverpool', 'LIV', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'UK' AND level = 'province')),
('Bristol', 'BRS', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'UK' AND level = 'province')),
('Leeds', 'LEE', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'UK' AND level = 'province'));

-- Germany (already exists, adding more cities)
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Hamburg', 'HAM', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DE' AND level = 'province')),
('Munich', 'MUN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DE' AND level = 'province')),
('Cologne', 'CGN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DE' AND level = 'province')),
('Frankfurt', 'FRA', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DE' AND level = 'province')),
('Stuttgart', 'STU', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DE' AND level = 'province')),
('Düsseldorf', 'DUS', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DE' AND level = 'province')),
('Dortmund', 'DTM', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DE' AND level = 'province')),
('Essen', 'ESS', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DE' AND level = 'province')),
('Leipzig', 'LEI', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DE' AND level = 'province')),
('Dresden', 'DRE', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DE' AND level = 'province'));

-- France (already exists, adding more cities)
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Lyon', 'LYO', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FR' AND level = 'province')),
('Marseille', 'MRS', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FR' AND level = 'province')),
('Toulouse', 'TLS', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FR' AND level = 'province')),
('Nice', 'NCE', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FR' AND level = 'province')),
('Nantes', 'NTE', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FR' AND level = 'province')),
('Strasbourg', 'SXB', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FR' AND level = 'province')),
('Montpellier', 'MPL', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FR' AND level = 'province')),
('Bordeaux', 'BOD', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FR' AND level = 'province')),
('Lille', 'LIL', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FR' AND level = 'province')),
('Rennes', 'RNS', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FR' AND level = 'province'));

-- Italy (already exists, adding more cities)  
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Milan', 'MIL', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'IT' AND level = 'province')),
('Naples', 'NAP', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'IT' AND level = 'province')),
('Turin', 'TUR', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'IT' AND level = 'province')),
('Florence', 'FLR', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'IT' AND level = 'province')),
('Bologna', 'BLQ', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'IT' AND level = 'province')),
('Genoa', 'GOA', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'IT' AND level = 'province')),
('Palermo', 'PAL', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'IT' AND level = 'province')),
('Catania', 'CTA', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'IT' AND level = 'province')),
('Bari', 'BRI', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'IT' AND level = 'province')),
('Venice', 'VCE', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'IT' AND level = 'province'));

-- Add new European countries and their major cities
-- Spain
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Spain', 'ES', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Madrid', 'MAD', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'ES' AND level = 'province')),
('Barcelona', 'BCN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'ES' AND level = 'province')),
('Valencia', 'VLC', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'ES' AND level = 'province')),
('Seville', 'SVQ', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'ES' AND level = 'province')),
('Zaragoza', 'ZAZ', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'ES' AND level = 'province')),
('Málaga', 'AGP', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'ES' AND level = 'province')),
('Murcia', 'MJV', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'ES' AND level = 'province')),
('Palma', 'PMI', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'ES' AND level = 'province')),
('Las Palmas', 'LAS', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'ES' AND level = 'province')),
('Bilbao', 'BIO', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'ES' AND level = 'province'));

-- Netherlands
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Netherlands', 'NL', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Amsterdam', 'AMS', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NL' AND level = 'province')),
('Rotterdam', 'RTM', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NL' AND level = 'province')),
('The Hague', 'HAG', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NL' AND level = 'province')),
('Utrecht', 'UTC', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NL' AND level = 'province')),
('Eindhoven', 'EIN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NL' AND level = 'province')),
('Tilburg', 'TIL', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NL' AND level = 'province')),
('Groningen', 'GRN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NL' AND level = 'province')),
('Almere', 'ALM', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NL' AND level = 'province'));

-- Belgium
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Belgium', 'BE', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Brussels', 'BRU', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'BE' AND level = 'province')),
('Antwerp', 'ANR', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'BE' AND level = 'province')),
('Ghent', 'GHE', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'BE' AND level = 'province')),
('Charleroi', 'CRL', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'BE' AND level = 'province')),
('Liège', 'LIE', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'BE' AND level = 'province')),
('Bruges', 'BRG', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'BE' AND level = 'province')),
('Namur', 'NAM', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'BE' AND level = 'province'));

-- Switzerland
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Switzerland', 'CH', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Zurich', 'ZUR', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'CH' AND level = 'province')),
('Geneva', 'GVA', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'CH' AND level = 'province')),
('Basel', 'BSL', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'CH' AND level = 'province')),
('Bern', 'BRN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'CH' AND level = 'province')),
('Lausanne', 'LSN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'CH' AND level = 'province')),
('Winterthur', 'WTR', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'CH' AND level = 'province')),
('Lucerne', 'LUC', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'CH' AND level = 'province'));

-- Austria
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Austria', 'AT', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Vienna', 'VIE', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'AT' AND level = 'province')),
('Graz', 'GRZ', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'AT' AND level = 'province')),
('Linz', 'LNZ', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'AT' AND level = 'province')),
('Salzburg', 'SZG', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'AT' AND level = 'province')),
('Innsbruck', 'INN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'AT' AND level = 'province')),
('Klagenfurt', 'KLA', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'AT' AND level = 'province'));

-- Sweden
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Sweden', 'SE', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Stockholm', 'STO', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'SE' AND level = 'province')),
('Gothenburg', 'GOT', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'SE' AND level = 'province')),
('Malmö', 'MMX', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'SE' AND level = 'province')),
('Uppsala', 'UPS', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'SE' AND level = 'province')),
('Västerås', 'VST', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'SE' AND level = 'province')),
('Örebro', 'ORE', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'SE' AND level = 'province'));

-- Norway
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Norway', 'NO', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Oslo', 'OSL', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NO' AND level = 'province')),
('Bergen', 'BGO', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NO' AND level = 'province')),
('Trondheim', 'TRD', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NO' AND level = 'province')),
('Stavanger', 'SVG', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NO' AND level = 'province')),
('Kristiansand', 'KRS', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NO' AND level = 'province')),
('Fredrikstad', 'FRE', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NO' AND level = 'province'));

-- Denmark
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Denmark', 'DK', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Copenhagen', 'CPH', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DK' AND level = 'province')),
('Aarhus', 'AAR', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DK' AND level = 'province')),
('Odense', 'ODE', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DK' AND level = 'province')),
('Aalborg', 'AAL', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DK' AND level = 'province')),
('Esbjerg', 'EBJ', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DK' AND level = 'province')),
('Randers', 'RAN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'DK' AND level = 'province'));

-- Finland
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Finland', 'FI', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Helsinki', 'HEL', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FI' AND level = 'province')),
('Espoo', 'ESP', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FI' AND level = 'province')),
('Tampere', 'TAM', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FI' AND level = 'province')),
('Vantaa', 'VAN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FI' AND level = 'province')),
('Oulu', 'OUL', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FI' AND level = 'province')),
('Turku', 'TKU', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'FI' AND level = 'province'));

-- Asian Countries and Major Cities
-- Japan
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Japan', 'JP', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Tokyo', 'TYO', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'JP' AND level = 'province')),
('Osaka', 'OSA', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'JP' AND level = 'province')),
('Kyoto', 'KYO', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'JP' AND level = 'province')),
('Yokohama', 'YOK', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'JP' AND level = 'province')),
('Nagoya', 'NGY', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'JP' AND level = 'province')),
('Sapporo', 'SPK', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'JP' AND level = 'province')),
('Fukuoka', 'FUK', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'JP' AND level = 'province')),
('Kobe', 'KOB', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'JP' AND level = 'province')),
('Hiroshima', 'HIR', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'JP' AND level = 'province')),
('Sendai', 'SEN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'JP' AND level = 'province'));

-- South Korea
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('South Korea', 'KR', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Seoul', 'SEL', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'KR' AND level = 'province')),
('Busan', 'PUS', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'KR' AND level = 'province')),
('Incheon', 'ICN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'KR' AND level = 'province')),
('Daegu', 'TAE', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'KR' AND level = 'province')),
('Daejeon', 'TJN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'KR' AND level = 'province')),
('Gwangju', 'KWJ', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'KR' AND level = 'province')),
('Ulsan', 'USN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'KR' AND level = 'province')),
('Suwon', 'SWN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'KR' AND level = 'province'));

-- Singapore
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Singapore', 'SG', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Singapore City', 'SIN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'SG' AND level = 'province'));

-- New Zealand (adding to existing Australia region)
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('New Zealand', 'NZ', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Auckland', 'AKL', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NZ' AND level = 'province')),
('Wellington', 'WLG', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NZ' AND level = 'province')),
('Christchurch', 'CHC', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NZ' AND level = 'province')),
('Hamilton', 'HLZ', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NZ' AND level = 'province')),
('Tauranga', 'TRG', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'NZ' AND level = 'province'));

-- Eastern European Countries
-- Poland
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Poland', 'PL', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Warsaw', 'WAW', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'PL' AND level = 'province')),
('Krakow', 'KRK', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'PL' AND level = 'province')),
('Łódź', 'LDZ', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'PL' AND level = 'province')),
('Wrocław', 'WRO', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'PL' AND level = 'province')),
('Poznań', 'POZ', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'PL' AND level = 'province')),
('Gdańsk', 'GDN', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'PL' AND level = 'province'));

-- Czech Republic
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Czech Republic', 'CZ', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Prague', 'PRG', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'CZ' AND level = 'province')),
('Brno', 'BRN_CZ', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'CZ' AND level = 'province')),
('Ostrava', 'OST', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'CZ' AND level = 'province')),
('Plzen', 'PLZ', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'CZ' AND level = 'province'));

-- Portugal
INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Portugal', 'PT', 'province', NULL);

INSERT INTO public.administrative_divisions (name, code, level, parent_id) VALUES
('Lisbon', 'LIS', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'PT' AND level = 'province')),
('Porto', 'OPO', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'PT' AND level = 'province')),
('Braga', 'BGC', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'PT' AND level = 'province')),
('Coimbra', 'CBR', 'district', (SELECT id FROM public.administrative_divisions WHERE code = 'PT' AND level = 'province'));