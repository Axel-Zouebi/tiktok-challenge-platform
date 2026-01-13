import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle } from "lucide-react"

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
        <CardTitle>Robux Budget</CardTitle>
        <CardDescription>Total giveaway budget: {TOTAL_BUDGET.toLocaleString()} Robux</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className="font-medium">{totalSpent.toLocaleString()} Robux</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className={`font-medium ${budgetExceeded ? "text-destructive" : ""}`}>
              {remaining.toLocaleString()} Robux
            </span>
          </div>
        </div>
        {budgetExceeded && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>Budget exceeded! Total spent is over the limit.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

