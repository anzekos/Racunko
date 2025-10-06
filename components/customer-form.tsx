"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Customer } from "@/app/page"
import { Calculator, Euro, FileText, User } from "lucide-react"

interface CustomerFormProps {
  customer: Customer | null
  onSubmit: (data: Partial<Customer>) => void
  onCancel: () => void
}

export function CustomerForm({ customer, onSubmit, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState<Partial<Customer>>({
    Stranka: "",
    Naslov: "",
    Kraj_postna_st: "",
    email: "",
    ID_DDV: "",
    Ukrep: "",
    JR: "",
    Pogodba: "",
    VLG: 0,
    VLG_z_DDV: 0,
    Gotovina_1: 0,
    Status_1: "",
    Racun_izdal_1: "",
    Opomba_Ponudba: "",
    Provizija: 0,
    ODL: 0,
    ODL_z_DDV: 0,
    Gotovina_2: 0,
    Status_2: "",
    Racun_izdal_2: "",
    Delež_odločba: 0,
    ZAH1: 0,
    ZAH1_z_DDV: 0,
    Gotovina_3: 0,
    Status_3: "",
    Racun_izdal_3: "",
    Delež_zah1: 0,
    ZAH2: 0,
    ZAH2_z_DDV: 0,
    Gotovina_4: 0,
    Status_4: "",
    Racun_izdal_4: "",
    Delež_zah2: 0,
    ZAH3: 0,
    ZAH3_z_DDV: 0,
    Gotovina_5: 0,
    Status_5: "",
    Racun_izdal_5: "",
    Delež_zah3: 0,
    ZAH4: 0,
    ZAH4_z_DDV: 0,
    Gotovina_6: 0,
    Status_6: "",
    Racun_izdal_6: "",
    Delež_zah4: 0,
    ZAH5: 0,
    ZAH5_z_DDV: 0,
    Gotovina_7: 0,
    Status_7: "",
    Racun_izdal_7: "",
    Delež_zah5: 0,
    Informacije: "",
    ODL_izplacano: 0,
    ZAH1_izplacano: 0,
    ZAH2_izplacano: 0,
    ZAH3_izplacano: 0,
    ZAH4_izplacano: 0,
    ZAH5_izplacano: 0,
    Izplacano: 0,
    Status_8: "",
    SKUPAJ: 0,
    KONTROLA: 0,
  })

  useEffect(() => {
    if (customer) {
      setFormData(customer)
    }
  }, [customer])

  const calculateDerivedValues = useCallback(() => {
    setFormData((prevData) => {
      const ddvFields = {
        VLG: "VLG_z_DDV",
        ODL: "ODL_z_DDV",
        ZAH1: "ZAH1_z_DDV",
        ZAH2: "ZAH2_z_DDV",
        ZAH3: "ZAH3_z_DDV",
        ZAH4: "ZAH4_z_DDV",
        ZAH5: "ZAH5_z_DDV",
      }

      const newData = { ...prevData }

      // Calculate DDV values
      Object.entries(ddvFields).forEach(([base, ddv]) => {
        const baseValue = Number(newData[base as keyof Customer]) || 0
        newData[ddv as keyof Customer] = Number((baseValue * 1.22).toFixed(2))
      })

      // Calculate totals
      const formulaFields = ["ODL", "ZAH1", "ZAH2", "ZAH3", "ZAH4", "ZAH5"]
      const skupaj = formulaFields.reduce((sum, field) => {
        return sum + (Number(newData[field as keyof Customer]) || 0)
      }, 0)
      newData.SKUPAJ = Number(skupaj.toFixed(2))

      const izplacano = [
        "ODL_izplacano",
        "ZAH1_izplacano",
        "ZAH2_izplacano",
        "ZAH3_izplacano",
        "ZAH4_izplacano",
        "ZAH5_izplacano",
      ].reduce((sum, field) => {
        return sum + (Number(newData[field as keyof Customer]) || 0)
      }, 0)
      newData.Izplacano = Number(izplacano.toFixed(2))

      const kontrola = (Number(newData.VLG) || 0) + (Number(newData.Izplacano) || 0) * (Number(newData.Provizija) || 0)
      newData.KONTROLA = Number(kontrola.toFixed(2))

      return newData
    })
  }, [])

  useEffect(() => {
    calculateDerivedValues()
  }, [
    formData.VLG,
    formData.ODL,
    formData.ZAH1,
    formData.ZAH2,
    formData.ZAH3,
    formData.ZAH4,
    formData.ZAH5,
    formData.ODL_izplacano,
    formData.ZAH1_izplacano,
    formData.ZAH2_izplacano,
    formData.ZAH3_izplacano,
    formData.ZAH4_izplacano,
    formData.ZAH5_izplacano,
    formData.Provizija,
    calculateDerivedValues,
  ])

  const handleInputChange = (field: keyof Customer, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="gap-2">
            <User className="h-4 w-4" />
            Osnovni podatki
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-2">
            <Euro className="h-4 w-4" />
            Finančni podatki
          </TabsTrigger>
          <TabsTrigger value="calculations" className="gap-2">
            <Calculator className="h-4 w-4" />
            Izračuni
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <FileText className="h-4 w-4" />
            Opombe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Podatki o stranki</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stranka">Stranka *</Label>
                <Input
                  id="stranka"
                  value={formData.Stranka || ""}
                  onChange={(e) => handleInputChange("Stranka", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="naslov">Naslov</Label>
                <Input
                  id="naslov"
                  value={formData.Naslov || ""}
                  onChange={(e) => handleInputChange("Naslov", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kraj">Kraj in poštna številka</Label>
                <Input
                  id="kraj"
                  value={formData.Kraj_postna_st || ""}
                  onChange={(e) => handleInputChange("Kraj_postna_st", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-pošta</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ddv">ID za DDV</Label>
                <Input
                  id="ddv"
                  value={formData.ID_DDV || ""}
                  onChange={(e) => handleInputChange("ID_DDV", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ukrep">Ukrep</Label>
                <Input
                  id="ukrep"
                  value={formData.Ukrep || ""}
                  onChange={(e) => handleInputChange("Ukrep", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>VLG podatki</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vlg">VLG</Label>
                    <Input
                      id="vlg"
                      type="number"
                      step="0.01"
                      value={formData.VLG || ""}
                      onChange={(e) => handleInputChange("VLG", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vlg_ddv">VLG z DDV</Label>
                    <Input
                      id="vlg_ddv"
                      type="number"
                      step="0.01"
                      value={formData.VLG_z_DDV || ""}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gotovina1">Gotovina 1</Label>
                  <Input
                    id="gotovina1"
                    type="number"
                    step="0.01"
                    value={formData.Gotovina_1 || ""}
                    onChange={(e) => handleInputChange("Gotovina_1", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provizija">Provizija</Label>
                  <Input
                    id="provizija"
                    type="number"
                    step="0.01"
                    value={formData.Provizija || ""}
                    onChange={(e) => handleInputChange("Provizija", Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ODL podatki</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="odl">ODL</Label>
                    <Input
                      id="odl"
                      type="number"
                      step="0.01"
                      value={formData.ODL || ""}
                      onChange={(e) => handleInputChange("ODL", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="odl_ddv">ODL z DDV</Label>
                    <Input
                      id="odl_ddv"
                      type="number"
                      step="0.01"
                      value={formData.ODL_z_DDV || ""}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="odl_izplacano">ODL izplačano</Label>
                  <Input
                    id="odl_izplacano"
                    type="number"
                    step="0.01"
                    value={formData.ODL_izplacano || ""}
                    onChange={(e) => handleInputChange("ODL_izplacano", Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calculations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <Card key={num}>
                <CardHeader>
                  <CardTitle>ZAH{num}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor={`zah${num}`}>ZAH{num}</Label>
                      <Input
                        id={`zah${num}`}
                        type="number"
                        step="0.01"
                        value={formData[`ZAH${num}` as keyof Customer] || ""}
                        onChange={(e) => handleInputChange(`ZAH${num}` as keyof Customer, Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`zah${num}_ddv`}>z DDV</Label>
                      <Input
                        id={`zah${num}_ddv`}
                        type="number"
                        step="0.01"
                        value={formData[`ZAH${num}_z_DDV` as keyof Customer] || ""}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`zah${num}_izplacano`}>Izplačano</Label>
                    <Input
                      id={`zah${num}_izplacano`}
                      type="number"
                      step="0.01"
                      value={formData[`ZAH${num}_izplacano` as keyof Customer] || ""}
                      onChange={(e) =>
                        handleInputChange(`ZAH${num}_izplacano` as keyof Customer, Number(e.target.value))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Skupni izračuni</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skupaj">SKUPAJ</Label>
                <Input
                  id="skupaj"
                  type="number"
                  step="0.01"
                  value={formData.SKUPAJ || ""}
                  readOnly
                  className="bg-muted font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="izplacano">Izplačano</Label>
                <Input
                  id="izplacano"
                  type="number"
                  step="0.01"
                  value={formData.Izplacano || ""}
                  readOnly
                  className="bg-muted font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kontrola">KONTROLA</Label>
                <Input
                  id="kontrola"
                  type="number"
                  step="0.01"
                  value={formData.KONTROLA || ""}
                  readOnly
                  className="bg-muted font-semibold"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dodatne informacije</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="informacije">Informacije</Label>
                <Input
                  id="informacije"
                  value={formData.Informacije || ""}
                  onChange={(e) => handleInputChange("Informacije", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opomba">Opomba/Ponudba</Label>
                <Input
                  id="opomba"
                  value={formData.Opomba_Ponudba || ""}
                  onChange={(e) => handleInputChange("Opomba_Ponudba", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-6 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>
          Prekliči
        </Button>
        <Button type="submit">{customer ? "Posodobi" : "Shrani"}</Button>
      </div>
    </form>
  )
}
