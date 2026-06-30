"use client"

import type React from "react"

import { useMemo, useState } from "react"
import {
  Receipt,
  Camera,
  Loader2,
  Plus,
  Trash2,
  Users,
  Check,
  RotateCcw,
  Calculator,
  UserPlus,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

type ReceiptItem = {
  id: string
  name: string
  price: number
  assignedTo: string[]
}

type Step = "upload" | "assign" | "summary"

type TipMode = "percent" | "amount"

const MOCK_ITEMS: Omit<ReceiptItem, "id" | "assignedTo">[] = [
  { name: "Ribeye Steak", price: 45.0 },
  { name: "Truffle Fries", price: 12.5 },
  { name: "Margarita", price: 14.0 },
  { name: "Caesar Salad", price: 11.0 },
  { name: "Tiramisu", price: 9.5 },
]

const uid = () => Math.random().toString(36).slice(2, 9)

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number.isFinite(n) ? n : 0,
  )

// Deterministic accent color per person for the avatars
const AVATAR_COLORS = [
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-primary",
]
const colorFor = (people: string[], name: string) =>
  AVATAR_COLORS[people.indexOf(name) % AVATAR_COLORS.length]

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

export default function BillSplitterPage() {
  const [step, setStep] = useState<Step>("upload")
  const [scanning, setScanning] = useState(false)

  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([])
  const [people, setPeople] = useState<string[]>(["Me"])

  const [newPerson, setNewPerson] = useState("")

  const [tax, setTax] = useState<number>(0)
  const [tipMode, setTipMode] = useState<TipMode>("percent")
  const [tipValue, setTipValue] = useState<number>(18)

  // --- Step 1: Mock OCR ---
  const handleScan = () => {
    setScanning(true)
    setTimeout(() => {
      setReceiptItems(
        MOCK_ITEMS.map((m) => ({ ...m, id: uid(), assignedTo: [] })),
      )
      setTax(7.25)
      setScanning(false)
      setStep("assign")
    }, 2000)
  }

  // --- People management ---
  const addPerson = () => {
    const name = newPerson.trim()
    if (!name || people.includes(name)) {
      setNewPerson("")
      return
    }
    setPeople((p) => [...p, name])
    setNewPerson("")
  }

  const removePerson = (name: string) => {
    setPeople((p) => p.filter((n) => n !== name))
    setReceiptItems((items) =>
      items.map((it) => ({
        ...it,
        assignedTo: it.assignedTo.filter((n) => n !== name),
      })),
    )
  }

  // --- Item management ---
  const toggleAssign = (itemId: string, name: string) => {
    setReceiptItems((items) =>
      items.map((it) => {
        if (it.id !== itemId) return it
        const has = it.assignedTo.includes(name)
        return {
          ...it,
          assignedTo: has
            ? it.assignedTo.filter((n) => n !== name)
            : [...it.assignedTo, name],
        }
      }),
    )
  }

  const updateItem = (
    itemId: string,
    field: "name" | "price",
    value: string,
  ) => {
    setReceiptItems((items) =>
      items.map((it) =>
        it.id === itemId
          ? {
              ...it,
              [field]: field === "price" ? Number(value) || 0 : value,
            }
          : it,
      ),
    )
  }

  const addItem = () => {
    setReceiptItems((items) => [
      ...items,
      { id: uid(), name: "New item", price: 0, assignedTo: [] },
    ])
  }

  const removeItem = (itemId: string) => {
    setReceiptItems((items) => items.filter((it) => it.id !== itemId))
  }

  const startOver = () => {
    setReceiptItems([])
    setPeople(["Me"])
    setNewPerson("")
    setTax(0)
    setTipMode("percent")
    setTipValue(18)
    setStep("upload")
  }

  // --- Math ---
  const subtotal = useMemo(
    () => receiptItems.reduce((sum, it) => sum + it.price, 0),
    [receiptItems],
  )

  const tipAmount = useMemo(() => {
    if (tipMode === "amount") return tipValue || 0
    return (subtotal * (tipValue || 0)) / 100
  }, [tipMode, tipValue, subtotal])

  const grandTotal = subtotal + (tax || 0) + tipAmount

  const breakdown = useMemo(() => {
    // Each person's subtotal from shared items
    const perPerson = people.map((name) => {
      const items = receiptItems
        .filter((it) => it.assignedTo.includes(name))
        .map((it) => ({
          name: it.name,
          share: it.price / it.assignedTo.length,
        }))
      const personSubtotal = items.reduce((s, i) => s + i.share, 0)
      return { name, items, personSubtotal }
    })

    const assignedSubtotal = perPerson.reduce(
      (s, p) => s + p.personSubtotal,
      0,
    )

    return perPerson.map((p) => {
      const ratio =
        assignedSubtotal > 0 ? p.personSubtotal / assignedSubtotal : 0
      const taxShare = (tax || 0) * ratio
      const tipShare = tipAmount * ratio
      return {
        ...p,
        ratio,
        taxShare,
        tipShare,
        total: p.personSubtotal + taxShare + tipShare,
      }
    })
  }, [people, receiptItems, tax, tipAmount])

  const unassignedCount = receiptItems.filter(
    (it) => it.assignedTo.length === 0,
  ).length

  return (
    <main className="min-h-screen bg-muted/40">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-6 sm:py-10">
        {/* Header */}
        <header className="mb-6 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Receipt className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight text-balance">
              SplitWise<span className="text-muted-foreground">.cam</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Snap, assign, and split the bill fairly.
            </p>
          </div>
        </header>

        {/* Step indicator */}
        <Stepper step={step} />

        <div className="mt-6 flex-1">
          {step === "upload" && (
            <UploadView scanning={scanning} onScan={handleScan} />
          )}

          {step === "assign" && (
            <AssignView
              people={people}
              newPerson={newPerson}
              setNewPerson={setNewPerson}
              addPerson={addPerson}
              removePerson={removePerson}
              receiptItems={receiptItems}
              toggleAssign={toggleAssign}
              updateItem={updateItem}
              addItem={addItem}
              removeItem={removeItem}
              tax={tax}
              setTax={setTax}
              tipMode={tipMode}
              setTipMode={setTipMode}
              tipValue={tipValue}
              setTipValue={setTipValue}
              subtotal={subtotal}
              tipAmount={tipAmount}
              grandTotal={grandTotal}
              unassignedCount={unassignedCount}
              onCalculate={() => setStep("summary")}
            />
          )}

          {step === "summary" && (
            <SummaryView
              breakdown={breakdown}
              people={people}
              subtotal={subtotal}
              tax={tax || 0}
              tipAmount={tipAmount}
              grandTotal={grandTotal}
              onBack={() => setStep("assign")}
              onReset={startOver}
            />
          )}
        </div>
      </div>
    </main>
  )
}

function Stepper({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "assign", label: "Assign" },
    { key: "summary", label: "Summary" },
  ]
  const activeIndex = steps.findIndex((s) => s.key === step)

  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < activeIndex
        const active = i === activeIndex
        return (
          <li key={s.key} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="size-4" aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={`text-sm font-medium ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={`h-px flex-1 ${done ? "bg-primary/40" : "bg-border"}`}
                aria-hidden="true"
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function UploadView({
  scanning,
  onScan,
}: {
  scanning: boolean
  onScan: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <button
          type="button"
          onClick={scanning ? undefined : onScan}
          disabled={scanning}
          aria-label="Upload receipt to scan"
          className="flex w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-14 text-center transition-colors hover:border-primary/50 hover:bg-muted/60 disabled:cursor-not-allowed"
        >
          {scanning ? (
            <>
              <Loader2
                className="size-10 animate-spin text-primary"
                aria-hidden="true"
              />
              <div>
                <p className="text-base font-medium">Scanning receipt...</p>
                <p className="text-sm text-muted-foreground">
                  Reading items with OCR magic
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Camera className="size-8" aria-hidden="true" />
              </div>
              <div>
                <p className="text-base font-medium">Tap to upload a receipt</p>
                <p className="text-sm text-muted-foreground">
                  Take a photo or choose from your library
                </p>
              </div>
            </>
          )}
        </button>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={onScan}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Scanning...
              </>
            ) : (
              <>
                <Camera className="size-4" /> Upload Receipt
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            This is a demo — we&apos;ll generate a sample restaurant receipt for
            you.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

type AssignViewProps = {
  people: string[]
  newPerson: string
  setNewPerson: (v: string) => void
  addPerson: () => void
  removePerson: (name: string) => void
  receiptItems: ReceiptItem[]
  toggleAssign: (itemId: string, name: string) => void
  updateItem: (itemId: string, field: "name" | "price", value: string) => void
  addItem: () => void
  removeItem: (itemId: string) => void
  tax: number
  setTax: (n: number) => void
  tipMode: TipMode
  setTipMode: (m: TipMode) => void
  tipValue: number
  setTipValue: (n: number) => void
  subtotal: number
  tipAmount: number
  grandTotal: number
  unassignedCount: number
  onCalculate: () => void
}

function AssignView(props: AssignViewProps) {
  const {
    people,
    newPerson,
    setNewPerson,
    addPerson,
    removePerson,
    receiptItems,
    toggleAssign,
    updateItem,
    addItem,
    removeItem,
    tax,
    setTax,
    tipMode,
    setTipMode,
    tipValue,
    setTipValue,
    subtotal,
    tipAmount,
    grandTotal,
    unassignedCount,
    onCalculate,
  } = props

  const onPersonKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === "Enter") {
      e.preventDefault()
      addPerson()
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* People */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" aria-hidden="true" /> Who&apos;s splitting?
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              value={newPerson}
              onChange={(e) => setNewPerson(e.target.value)}
              onKeyDown={onPersonKeyDown}
              placeholder="Add a friend's name"
              aria-label="Friend's name"
            />
            <Button onClick={addPerson} variant="secondary" className="shrink-0">
              <UserPlus className="size-4" /> Add
            </Button>
          </div>

          {people.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add some friends to start splitting!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {people.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-2 text-sm"
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-[10px] font-semibold text-primary-foreground ${colorFor(
                      people,
                      name,
                    )}`}
                  >
                    {initials(name)}
                  </span>
                  <span className="font-medium">{name}</span>
                  <button
                    type="button"
                    onClick={() => removePerson(name)}
                    aria-label={`Remove ${name}`}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Items</h2>
          {unassignedCount > 0 && (
            <Badge variant="secondary" className="font-normal">
              {unassignedCount} unassigned
            </Badge>
          )}
        </div>

        {receiptItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start gap-2">
                <div className="grid flex-1 grid-cols-[1fr_auto] gap-2">
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(item.id, "name", e.target.value)}
                    aria-label="Item name"
                    className="font-medium"
                  />
                  <div className="relative w-28">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(item.id, "price", e.target.value)
                      }
                      aria-label="Item price"
                      className="pl-6 text-right"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {people.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Add friends above to assign this item.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {people.map((name) => {
                    const active = item.assignedTo.includes(name)
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleAssign(item.id, name)}
                        aria-pressed={active}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {active && <Check className="size-3.5" />}
                        {name}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={addItem} className="w-full">
          <Plus className="size-4" /> Add an item
        </Button>
      </div>

      {/* Tax & Tip */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tax &amp; Gratuity</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tax">Tax ($)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="tax"
                  type="number"
                  min="0"
                  step="0.01"
                  value={tax}
                  onChange={(e) => setTax(Number(e.target.value) || 0)}
                  className="pl-6"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tip">
                Tip ({tipMode === "percent" ? "%" : "$"})
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  {tipMode === "amount" && (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                  )}
                  <Input
                    id="tip"
                    type="number"
                    min="0"
                    step={tipMode === "percent" ? "1" : "0.01"}
                    value={tipValue}
                    onChange={(e) => setTipValue(Number(e.target.value) || 0)}
                    className={tipMode === "amount" ? "pl-6" : ""}
                  />
                </div>
                <div className="flex overflow-hidden rounded-md border">
                  <button
                    type="button"
                    onClick={() => setTipMode("percent")}
                    className={`px-3 text-sm font-medium transition-colors ${
                      tipMode === "percent"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground"
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipMode("amount")}
                    className={`px-3 text-sm font-medium transition-colors ${
                      tipMode === "amount"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground"
                    }`}
                  >
                    $
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <dl className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{currency(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tax</dt>
              <dd className="font-medium">{currency(tax || 0)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Tip{tipMode === "percent" ? ` (${tipValue || 0}%)` : ""}
              </dt>
              <dd className="font-medium">{currency(tipAmount)}</dd>
            </div>
            <div className="mt-1 flex justify-between border-t pt-2 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold">{currency(grandTotal)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full"
        onClick={onCalculate}
        disabled={people.length === 0 || receiptItems.length === 0}
      >
        <Calculator className="size-4" /> Calculate Split
      </Button>
    </div>
  )
}

type BreakdownEntry = {
  name: string
  items: { name: string; share: number }[]
  personSubtotal: number
  ratio: number
  taxShare: number
  tipShare: number
  total: number
}

function SummaryView({
  breakdown,
  people,
  subtotal,
  tax,
  tipAmount,
  grandTotal,
  onBack,
  onReset,
}: {
  breakdown: BreakdownEntry[]
  people: string[]
  subtotal: number
  tax: number
  tipAmount: number
  grandTotal: number
  onBack: () => void
  onReset: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm opacity-80">Total bill</p>
            <p className="text-3xl font-semibold tracking-tight">
              {currency(grandTotal)}
            </p>
          </div>
          <div className="text-right text-sm opacity-90">
            <p>Subtotal {currency(subtotal)}</p>
            <p>Tax {currency(tax)}</p>
            <p>Tip {currency(tipAmount)}</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold">Each person owes</h2>
        <Accordion openMultiple={false} className="flex flex-col gap-3">
          {breakdown.map((p) => (
            <AccordionItem
              key={p.name}
              value={p.name}
              className="rounded-xl border bg-card px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex w-full items-center justify-between gap-3 pr-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground ${colorFor(
                        people,
                        p.name,
                      )}`}
                    >
                      {initials(p.name)}
                    </span>
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {currency(p.total)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {p.items.length === 0 ? (
                  <p className="pb-2 text-sm text-muted-foreground">
                    No items assigned.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5 pb-1 text-sm">
                    {p.items.map((it, idx) => (
                      <li
                        key={`${it.name}-${idx}`}
                        className="flex justify-between"
                      >
                        <span className="text-muted-foreground">{it.name}</span>
                        <span>{currency(it.share)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Separator className="my-2" />
                <ul className="flex flex-col gap-1.5 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{currency(p.personSubtotal)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tax share ({Math.round(p.ratio * 100)}%)
                    </span>
                    <span>{currency(p.taxShare)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tip share ({Math.round(p.ratio * 100)}%)
                    </span>
                    <span>{currency(p.tipShare)}</span>
                  </li>
                  <li className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total</span>
                    <span>{currency(p.total)}</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          <Pencil className="size-4" /> Edit split
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onReset}>
          <RotateCcw className="size-4" /> Start Over
        </Button>
      </div>
    </div>
  )
}
