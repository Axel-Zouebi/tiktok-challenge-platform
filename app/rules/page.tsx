import Image from "next/image"

// Add your 1920x1080 rules images to public/rules/ and list their paths here
const RULES_IMAGES = [
  "/rules/1.png",
  "/rules/2.png",
  "/rules/3.png",
  "/rules/4.png",
  "/rules/5.png",
]

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:gap-6 items-center">
          {RULES_IMAGES.map((src, i) => (
            <div
              key={i}
              className="w-full relative aspect-video overflow-hidden rounded-none sm:rounded-lg"
            >
              <Image
                src={src}
                alt={`Rules slide ${i + 1}`}
                fill
                className="object-contain object-top"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1920px"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
