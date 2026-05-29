import { Badge } from "@/components/ui/badge";

interface CompetitorCardProps {
  name: string;
  website: string;
  description: string;
  tags?: string[];
}

export default function CompetitorCard({ name, website, description, tags }: CompetitorCardProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold text-sm">{name}</div>
          <div className="text-xs text-muted-foreground">{website}</div>
        </div>
        {tags && (
          <div className="flex flex-wrap gap-1 justify-end">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
