import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

interface CCUCardProps {
  ccu: number
  gameName?: string
}

export function CCUCard({ ccu, gameName }: CCUCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Current Players
        </CardTitle>
        <CardDescription>
          {gameName || "One Last Stand"} - Live concurrent users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">{ccu.toLocaleString()}</div>
        <p className="text-sm text-muted-foreground mt-2">
          Playing right now
        </p>
      </CardContent>
    </Card>
  )
}

