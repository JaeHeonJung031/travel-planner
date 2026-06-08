import { PrismaClient } from "@prisma/client";
import { searchPlaces, getPlaceDetail, REGION_COORDS, THEME_QUERIES } from "../src/server/ai/places";
import { tagPlaces } from "../src/server/ai/tagger";

const prisma = new PrismaClient();

type Region = keyof typeof REGION_COORDS;

const REGION_LABEL: Record<Region, string> = {
  TOKYO: "도쿄",
  OSAKA_KYOTO: "오사카·교토",
  SAPPORO: "삿포로",
  FUKUOKA: "후쿠오카",
};

// 특정 지역 + 주제 데이터 수집
async function collectByRegionAndTheme(
  region: Region,
  theme: string
) {
  console.log(`\n📍 [${REGION_LABEL[region]}] ${theme} 수집 시작...`);

  const queries = THEME_QUERIES[theme] ?? [];
  const allPlaces = [];

  // 주제별 키워드로 검색
  for (const query of queries) {
    console.log(`  🔍 검색: ${query}`);
    const places = await searchPlaces(
      `${query} ${REGION_LABEL[region]}`,
      region
    );
    allPlaces.push(...places);

    // API 호출 간격
    await new Promise((r) => setTimeout(r, 300));
  }

  // 중복 제거
  const unique = allPlaces.filter(
    (p, i, self) => self.findIndex((q) => q.place_id === p.place_id) === i
  );

  console.log(`  ✅ ${unique.length}개 장소 발견`);

  // 상세 정보 수집 (리뷰 포함)
  console.log(`  📝 상세 정보 수집 중...`);
  const detailed = [];
  for (const place of unique.slice(0, 10)) { // 주제당 최대 10개
    const detail = await getPlaceDetail(place.place_id);
    if (detail) detailed.push(detail);
    await new Promise((r) => setTimeout(r, 300));
  }

  // LLM 태깅
  console.log(`  🤖 LLM 태깅 중...`);
  const tagged = await tagPlaces(detailed, REGION_LABEL[region]);

  // DB 저장
  console.log(`  💾 DB 저장 중...`);
  let saved = 0;
  for (const place of tagged) {
    try {
      await prisma.place.upsert({
        where: { googleId: place.googleId },
        update: {
          name: place.name,
          nameKo: place.nameKo,
          description: place.description,
          tags: place.tags,
          theme: place.theme,
          tips: place.tips, 
          rating: place.rating,
          priceLevel: place.priceLevel,
          hours: place.hours ?? undefined,
          imageUrl: place.imageUrl,
          lat: place.lat,
          lng: place.lng,
          address: place.address,
        },
        create: {
          googleId: place.googleId,
          region: region,
          theme: place.theme,
          name: place.name,
          nameKo: place.nameKo,
          description: place.description,
          tags: place.tags,
          tips: place.tips,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          rating: place.rating,
          priceLevel: place.priceLevel,
          hours: place.hours ?? undefined,
          imageUrl: place.imageUrl,
          verified: false,
        },
      });
      saved++;
    } catch (error) {
      console.error(`  ❌ 저장 실패 (${place.name}):`, error);
    }
  }

  console.log(`  ✅ ${saved}개 저장 완료!`);
}

// 전체 수집 실행
async function main() {
  const regions: Region[] = ["TOKYO", "OSAKA_KYOTO", "SAPPORO", "FUKUOKA"];
  const themes = Object.keys(THEME_QUERIES);

  console.log("🚀 데이터 수집 시작!");
  console.log(`📊 총 ${regions.length * themes.length}개 조합 처리 예정\n`);

  for (const region of regions) {
    for (const theme of themes) {
      await collectByRegionAndTheme(region, theme);
      // 지역/주제 간 간격
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log("\n🎉 전체 수집 완료!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});