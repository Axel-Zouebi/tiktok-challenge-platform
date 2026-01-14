import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface RobuxCardProps {
  totalSpent: number
  remaining: number
  budgetExceeded: boolean
}

const TOTAL_BUDGET = 50000

export function RobuxCard({ totalSpent, remaining, budgetExceeded }: RobuxCardProps) {
  const percentage = Math.min(100, (totalSpent / TOTAL_BUDGET) * 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Robux Giveaway</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percentage} className="h-2" />
        <div className="text-sm">
          <span className="text-muted-foreground">Remaining </span>
          <span className={`font-medium ${budgetExceeded ? "text-destructive" : ""}`}>
            {remaining.toLocaleString()} / {TOTAL_BUDGET.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

