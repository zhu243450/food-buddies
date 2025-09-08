-- Add prefecture-level cities for multiple provinces/regions (idempotent)
-- Jiangsu (320000)
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '320000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('南京市','320100','city',(SELECT id FROM prov), true, 0),
('无锡市','320200','city',(SELECT id FROM prov), true, 0),
('徐州市','320300','city',(SELECT id FROM prov), true, 0),
('常州市','320400','city',(SELECT id FROM prov), true, 0),
('苏州市','320500','city',(SELECT id FROM prov), true, 0),
('南通市','320600','city',(SELECT id FROM prov), true, 0),
('连云港市','320700','city',(SELECT id FROM prov), true, 0),
('淮安市','320800','city',(SELECT id FROM prov), true, 0),
('盐城市','320900','city',(SELECT id FROM prov), true, 0),
('扬州市','321000','city',(SELECT id FROM prov), true, 0),
('镇江市','321100','city',(SELECT id FROM prov), true, 0),
('泰州市','321200','city',(SELECT id FROM prov), true, 0),
('宿迁市','321300','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;

-- Anhui (340000)
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '340000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('合肥市','340100','city',(SELECT id FROM prov), true, 0),
('芜湖市','340200','city',(SELECT id FROM prov), true, 0),
('蚌埠市','340300','city',(SELECT id FROM prov), true, 0),
('淮南市','340400','city',(SELECT id FROM prov), true, 0),
('马鞍山市','340500','city',(SELECT id FROM prov), true, 0),
('淮北市','340600','city',(SELECT id FROM prov), true, 0),
('铜陵市','340700','city',(SELECT id FROM prov), true, 0),
('安庆市','340800','city',(SELECT id FROM prov), true, 0),
('黄山市','341000','city',(SELECT id FROM prov), true, 0),
('滁州市','341100','city',(SELECT id FROM prov), true, 0),
('阜阳市','341200','city',(SELECT id FROM prov), true, 0),
('宿州市','341300','city',(SELECT id FROM prov), true, 0),
('六安市','341500','city',(SELECT id FROM prov), true, 0),
('亳州市','341600','city',(SELECT id FROM prov), true, 0),
('池州市','341700','city',(SELECT id FROM prov), true, 0),
('宣城市','341800','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;

-- Hubei (420000)
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '420000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('武汉市','420100','city',(SELECT id FROM prov), true, 0),
('黄石市','420200','city',(SELECT id FROM prov), true, 0),
('十堰市','420300','city',(SELECT id FROM prov), true, 0),
('宜昌市','420500','city',(SELECT id FROM prov), true, 0),
('襄阳市','420600','city',(SELECT id FROM prov), true, 0),
('鄂州市','420700','city',(SELECT id FROM prov), true, 0),
('荆门市','420800','city',(SELECT id FROM prov), true, 0),
('孝感市','420900','city',(SELECT id FROM prov), true, 0),
('荆州市','421000','city',(SELECT id FROM prov), true, 0),
('黄冈市','421100','city',(SELECT id FROM prov), true, 0),
('咸宁市','421200','city',(SELECT id FROM prov), true, 0),
('随州市','421300','city',(SELECT id FROM prov), true, 0),
('恩施土家族苗族自治州','422800','city',(SELECT id FROM prov), true, 0),
('仙桃市','429004','city',(SELECT id FROM prov), true, 0),
('潜江市','429005','city',(SELECT id FROM prov), true, 0),
('天门市','429006','city',(SELECT id FROM prov), true, 0),
('神农架林区','429021','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;

-- Hunan (430000)
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '430000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('长沙市','430100','city',(SELECT id FROM prov), true, 0),
('株洲市','430200','city',(SELECT id FROM prov), true, 0),
('湘潭市','430300','city',(SELECT id FROM prov), true, 0),
('衡阳市','430400','city',(SELECT id FROM prov), true, 0),
('邵阳市','430500','city',(SELECT id FROM prov), true, 0),
('岳阳市','430600','city',(SELECT id FROM prov), true, 0),
('常德市','430700','city',(SELECT id FROM prov), true, 0),
('张家界市','430800','city',(SELECT id FROM prov), true, 0),
('益阳市','430900','city',(SELECT id FROM prov), true, 0),
('郴州市','431000','city',(SELECT id FROM prov), true, 0),
('永州市','431100','city',(SELECT id FROM prov), true, 0),
('怀化市','431200','city',(SELECT id FROM prov), true, 0),
('娄底市','431300','city',(SELECT id FROM prov), true, 0),
('湘西土家族苗族自治州','433100','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;

-- Sichuan (510000) - including autonomous prefectures
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '510000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('成都市','510100','city',(SELECT id FROM prov), true, 0),
('自贡市','510300','city',(SELECT id FROM prov), true, 0),
('攀枝花市','510400','city',(SELECT id FROM prov), true, 0),
('泸州市','510500','city',(SELECT id FROM prov), true, 0),
('德阳市','510600','city',(SELECT id FROM prov), true, 0),
('绵阳市','510700','city',(SELECT id FROM prov), true, 0),
('广元市','510800','city',(SELECT id FROM prov), true, 0),
('遂宁市','510900','city',(SELECT id FROM prov), true, 0),
('内江市','511000','city',(SELECT id FROM prov), true, 0),
('乐山市','511100','city',(SELECT id FROM prov), true, 0),
('南充市','511300','city',(SELECT id FROM prov), true, 0),
('眉山市','511400','city',(SELECT id FROM prov), true, 0),
('宜宾市','511500','city',(SELECT id FROM prov), true, 0),
('广安市','511600','city',(SELECT id FROM prov), true, 0),
('达州市','511700','city',(SELECT id FROM prov), true, 0),
('雅安市','511800','city',(SELECT id FROM prov), true, 0),
('巴中市','511900','city',(SELECT id FROM prov), true, 0),
('资阳市','512000','city',(SELECT id FROM prov), true, 0),
('阿坝藏族羌族自治州','513200','city',(SELECT id FROM prov), true, 0),
('甘孜藏族自治州','513300','city',(SELECT id FROM prov), true, 0),
('凉山彝族自治州','513400','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;

-- Chongqing (500000) - municipality
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '500000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('重庆市辖区','500100','city',(SELECT id FROM prov), true, 0),
('重庆县','500200','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;

-- Tibet (540000)
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '540000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('拉萨市','540100','city',(SELECT id FROM prov), true, 0),
('日喀则市','540200','city',(SELECT id FROM prov), true, 0),
('昌都市','540300','city',(SELECT id FROM prov), true, 0),
('林芝市','540400','city',(SELECT id FROM prov), true, 0),
('山南市','540500','city',(SELECT id FROM prov), true, 0),
('那曲市','540600','city',(SELECT id FROM prov), true, 0),
('阿里地区','542500','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;

-- Xinjiang (650000)
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '650000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('乌鲁木齐市','650100','city',(SELECT id FROM prov), true, 0),
('克拉玛依市','650200','city',(SELECT id FROM prov), true, 0),
('吐鲁番市','650400','city',(SELECT id FROM prov), true, 0),
('哈密市','650500','city',(SELECT id FROM prov), true, 0),
('昌吉回族自治州','652300','city',(SELECT id FROM prov), true, 0),
('博尔塔拉蒙古自治州','652700','city',(SELECT id FROM prov), true, 0),
('巴音郭楞蒙古自治州','652800','city',(SELECT id FROM prov), true, 0),
('阿克苏地区','652900','city',(SELECT id FROM prov), true, 0),
('克孜勒苏柯尔克孜自治州','653000','city',(SELECT id FROM prov), true, 0),
('喀什地区','653100','city',(SELECT id FROM prov), true, 0),
('和田地区','653200','city',(SELECT id FROM prov), true, 0),
('伊犁哈萨克自治州','654000','city',(SELECT id FROM prov), true, 0),
('塔城地区','654200','city',(SELECT id FROM prov), true, 0),
('阿勒泰地区','654300','city',(SELECT id FROM prov), true, 0),
('石河子市','659001','city',(SELECT id FROM prov), true, 0),
('阿拉尔市','659002','city',(SELECT id FROM prov), true, 0),
('图木舒克市','659003','city',(SELECT id FROM prov), true, 0),
('五家渠市','659004','city',(SELECT id FROM prov), true, 0),
('北屯市','659005','city',(SELECT id FROM prov), true, 0),
('铁门关市','659006','city',(SELECT id FROM prov), true, 0),
('双河市','659007','city',(SELECT id FROM prov), true, 0),
('可克达拉市','659008','city',(SELECT id FROM prov), true, 0),
('昆玉市','659009','city',(SELECT id FROM prov), true, 0),
('胡杨河市','659010','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;

-- Liaoning (210000)
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '210000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('沈阳市','210100','city',(SELECT id FROM prov), true, 0),
('大连市','210200','city',(SELECT id FROM prov), true, 0),
('鞍山市','210300','city',(SELECT id FROM prov), true, 0),
('抚顺市','210400','city',(SELECT id FROM prov), true, 0),
('本溪市','210500','city',(SELECT id FROM prov), true, 0),
('丹东市','210600','city',(SELECT id FROM prov), true, 0),
('锦州市','210700','city',(SELECT id FROM prov), true, 0),
('营口市','210800','city',(SELECT id FROM prov), true, 0),
('阜新市','210900','city',(SELECT id FROM prov), true, 0),
('辽阳市','211000','city',(SELECT id FROM prov), true, 0),
('盘锦市','211100','city',(SELECT id FROM prov), true, 0),
('铁岭市','211200','city',(SELECT id FROM prov), true, 0),
('朝阳市','211300','city',(SELECT id FROM prov), true, 0),
('葫芦岛市','211400','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;

-- Jilin (220000)
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '220000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('长春市','220100','city',(SELECT id FROM prov), true, 0),
('吉林市','220200','city',(SELECT id FROM prov), true, 0),
('四平市','220300','city',(SELECT id FROM prov), true, 0),
('辽源市','220400','city',(SELECT id FROM prov), true, 0),
('通化市','220500','city',(SELECT id FROM prov), true, 0),
('白山市','220600','city',(SELECT id FROM prov), true, 0),
('松原市','220700','city',(SELECT id FROM prov), true, 0),
('白城市','220800','city',(SELECT id FROM prov), true, 0),
('延边朝鲜族自治州','222400','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;

-- Heilongjiang (230000)
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '230000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('哈尔滨市','230100','city',(SELECT id FROM prov), true, 0),
('齐齐哈尔市','230200','city',(SELECT id FROM prov), true, 0),
('鸡西市','230300','city',(SELECT id FROM prov), true, 0),
('鹤岗市','230400','city',(SELECT id FROM prov), true, 0),
('双鸭山市','230500','city',(SELECT id FROM prov), true, 0),
('大庆市','230600','city',(SELECT id FROM prov), true, 0),
('伊春市','230700','city',(SELECT id FROM prov), true, 0),
('佳木斯市','230800','city',(SELECT id FROM prov), true, 0),
('七台河市','230900','city',(SELECT id FROM prov), true, 0),
('牡丹江市','231000','city',(SELECT id FROM prov), true, 0),
('黑河市','231100','city',(SELECT id FROM prov), true, 0),
('绥化市','231200','city',(SELECT id FROM prov), true, 0),
('大兴安岭地区','232700','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;