import { avatarColor, initialFor } from "@/lib/avatar";

export default function Avatar({
  name,
  imageUrl,
  sizeClass = "size-11",
  radiusClass = "rounded-2xl",
  textClass = "text-sm",
  online = false,
}: {
  name?: string | null;
  imageUrl?: string | null;
  sizeClass?: string;
  radiusClass?: string;
  textClass?: string;
  online?: boolean;
}) {
  const label = name ?? "";
  return (
    <div className={`relative ${sizeClass} flex-none`}>
      <div
        className={`size-full ${radiusClass} overflow-hidden ring-1 ring-black/5 dark:ring-white/10`}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={label}
            className="size-full object-cover"
          />
        ) : (
          <div
            className={`size-full flex items-center justify-center font-semibold text-white ${textClass}`}
            style={{ backgroundColor: avatarColor(label) }}
          >
            {initialFor(label)}
          </div>
        )}
      </div>
      {online && (
        <span className="oc-online absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full" />
      )}
    </div>
  );
}
