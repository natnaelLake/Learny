"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api, ApiError } from "@/lib/api"

interface Course {
  _id: string
  title: string
  price: number
  originalPrice?: number
  instructor: {
    name: string
  }
}

interface PaymentModalProps {
  course: Course
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({ course, onClose, onSuccess }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handlePayment = async () => {
    setIsProcessing(true)

    try {
      // For MVP, we simulate a successful payment without hitting a real payment API
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      toast({
        title: "Payment Processed",
        description: "Your enrollment is being finalized.",
      })
      
      onSuccess()

    } catch (error) {
      toast({
        title: "An Error Occurred",
        description: "We couldn't process your enrollment. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>You're about to enroll in {course.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">{course.title}</span>
                <span className="text-sm font-medium">${course.price}</span>
              </div>
              {course.originalPrice && course.originalPrice > course.price && (
                <div className="flex justify-between text-green-600">
                  <span className="text-sm">Discount</span>
                  <span className="text-sm">-${course.originalPrice - course.price}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${course.price}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input id="cardNumber" placeholder="1234 5678 9012 3456" maxLength={19} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input id="expiry" placeholder="MM/YY" maxLength={5} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input id="cvc" placeholder="123" maxLength={3} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Cardholder Name</Label>
                <Input id="name" placeholder="John Doe" />
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={isProcessing} className="flex-1">
              {isProcessing ? "Processing..." : `Pay $${course.price}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
