import { Badge } from "@/components/ui/badge"

interface EligibilityBadgeProps {
  isEligible: boolean
  className?: string
}

export function EligibilityBadge({ isEligible, className }: EligibilityBadgeProps) {
  return (
    <Badge
      variant={isEligible ? "success" : "destructive"}
      className={className}
    >
      {isEligible ? "Eligible" : "Not Eligible"}
    </Badge>
  )
}

