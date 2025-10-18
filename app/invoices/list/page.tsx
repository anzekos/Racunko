// V app/invoices/view/[id]/page.tsx dodajte:

const handleMarkAsUnpaid = async () => {
  if (invoice) {
    if (confirm(`Ali ste prepričani, da želite označiti račun ${invoice.invoiceNumber} kot neplačan?`)) {
      try {
        await updateInvoiceStatus(invoice.id!, 'sent')
        loadInvoice(invoice.id!)
      } catch (error) {
        console.error("Error marking invoice as unpaid:", error)
        alert("Napaka pri označevanju računa kot neplačan")
      }
    }
  }
}

// In v JSX dodajte gumb:
{invoice.status === 'paid' && (
  <Button 
    variant="outline" 
    onClick={handleMarkAsUnpaid} 
    className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
  >
    <XCircle className="h-4 w-4" />
    Označi kot neplačan
  </Button>
)}
