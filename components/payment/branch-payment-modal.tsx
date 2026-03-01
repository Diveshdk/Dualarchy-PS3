'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CreditCard, Smartphone, Building2, CheckCircle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BranchPaymentModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (paymentData: PaymentData) => Promise<void>
}

interface PaymentData {
  amount: number
  payment_method: 'card' | 'upi' | 'netbanking'
  transaction_id: string
}

export function BranchPaymentModal({ open, onClose, onSuccess }: BranchPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  // Card details
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  
  // UPI details
  const [upiId, setUpiId] = useState('')
  
  // Netbanking
  const [selectedBank, setSelectedBank] = useState('')

  const BRANCH_PRICE = 5000

  const handlePayment = async () => {
    setIsProcessing(true)
    
    try {
      // Simulate payment gateway delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate transaction ID
      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      
      const paymentData: PaymentData = {
        amount: BRANCH_PRICE,
        payment_method: paymentMethod,
        transaction_id: transactionId
      }
      
      // Show success animation
      setIsSuccess(true)
      
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Call success callback
      await onSuccess(paymentData)
      
      // Reset and close
      resetForm()
      onClose()
    } catch (error) {
      console.error('Payment failed:', error)
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setCardNumber('')
    setCardName('')
    setExpiryDate('')
    setCvv('')
    setUpiId('')
    setSelectedBank('')
    setIsProcessing(false)
    setIsSuccess(false)
  }

  const isFormValid = () => {
    if (paymentMethod === 'card') {
      return cardNumber.length >= 16 && cardName && expiryDate && cvv.length === 3
    } else if (paymentMethod === 'upi') {
      return upiId.includes('@')
    } else if (paymentMethod === 'netbanking') {
      return selectedBank !== ''
    }
    return false
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle className="w-20 h-20 text-green-500" />
              </motion.div>
              <h3 className="text-2xl font-bold mt-4">Payment Successful!</h3>
              <p className="text-muted-foreground mt-2">Processing your branch purchase...</p>
            </motion.div>
          ) : (
            <motion.div
              key="payment-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Purchase Branch Slot</DialogTitle>
                <DialogDescription>
                  Add a new branch to your banquet management system
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                {/* Price Display */}
                <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-lg border-2 border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Branch Slot Price</p>
                      <p className="text-3xl font-bold text-primary">₹{BRANCH_PRICE.toLocaleString()}</p>
                    </div>
                    <Building2 className="w-12 h-12 text-primary opacity-50" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    One-time payment • Lifetime access • Full features
                  </p>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Select Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <div className="grid grid-cols-3 gap-3">
                      <label className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}>
                        <RadioGroupItem value="card" className="sr-only" />
                        <CreditCard className="w-6 h-6 mb-2" />
                        <span className="text-sm font-medium">Card</span>
                      </label>
                      
                      <label className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}>
                        <RadioGroupItem value="upi" className="sr-only" />
                        <Smartphone className="w-6 h-6 mb-2" />
                        <span className="text-sm font-medium">UPI</span>
                      </label>
                      
                      <label className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'netbanking' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}>
                        <RadioGroupItem value="netbanking" className="sr-only" />
                        <Building2 className="w-6 h-6 mb-2" />
                        <span className="text-sm font-medium">Bank</span>
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Payment Details Forms */}
                <AnimatePresence mode="wait">
                  {paymentMethod === 'card' && (
                    <motion.div
                      key="card"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                          maxLength={16}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardName">Cardholder Name</Label>
                        <Input
                          id="cardName"
                          placeholder="John Doe"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input
                            id="expiry"
                            placeholder="MM/YY"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            type="password"
                            placeholder="123"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                            maxLength={3}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === 'upi' && (
                    <motion.div
                      key="upi"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input
                        id="upiId"
                        placeholder="yourname@paytm"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Enter any UPI ID (demo mode - all payments succeed)
                      </p>
                    </motion.div>
                  )}

                  {paymentMethod === 'netbanking' && (
                    <motion.div
                      key="netbanking"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Label htmlFor="bank">Select Bank</Label>
                      <select
                        id="bank"
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                      >
                        <option value="">Choose your bank</option>
                        <option value="hdfc">HDFC Bank</option>
                        <option value="icici">ICICI Bank</option>
                        <option value="sbi">State Bank of India</option>
                        <option value="axis">Axis Bank</option>
                        <option value="kotak">Kotak Mahindra Bank</option>
                      </select>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePayment}
                    disabled={!isFormValid() || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay ₹${BRANCH_PRICE.toLocaleString()}`
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  🔒 Demo Mode: All payments will succeed automatically
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
