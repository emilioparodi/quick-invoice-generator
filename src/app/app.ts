import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  isExporting = false;

  businessName = 'Your Company Name';
  businessAddress = '123 Business Street, City\nVAT: 01234567890';
  clientName = 'John Doe';
  clientAddress = '45 Client Avenue, City';

  invoiceNumber = '2026-001';
  invoiceDate = '2026-01-30';
  currencyCode = signal('EUR');
  taxRate = signal(22);
  footerNote = 'Payment Terms: Bank Transfer\nIBAN: IT 00 X 00000 00000 000000000000';
  logoUrl = signal<string | null>(null);

  items = signal<any[]>([
    { id: 1, description: 'Consultancy Service', quantity: 1, price: 500, discount: 0 }
  ]);

  updateTotals() {
    this.items.update(items => [...items]);
  }

  subTotal = computed(() =>
    this.items().reduce((acc, item) =>
      acc + (item.quantity * item.price * (1 - (item.discount || 0) / 100)), 0)
  );

  taxAmount = computed(() => this.subTotal() * (this.taxRate() / 100));
  total = computed(() => this.subTotal() + this.taxAmount());

  addItem() {
    this.items.update(prev => [...prev, { id: Date.now(), description: '', quantity: 1, price: 0, discount: 0 }]);
  }

  removeItem(id: number) {
    this.items.update(prev => prev.filter(i => i.id !== id));
  }

  onLogoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.logoUrl.set(e.target.result);
      reader.readAsDataURL(file);
    }
  }

  async downloadPDF() {
    this.isExporting = true;
    const element = document.getElementById('printable');
    if (!element) return;

    setTimeout(async () => {
      try {
        const canvas = await html2canvas(element, {
          scale: 3,
          useCORS: true,
          scrollY: -window.scrollY,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Invoice_${this.invoiceNumber}.pdf`);
      } catch (err) {
        console.error("Errore PDF:", err);
      } finally {
        this.isExporting = false;
      }
    }, 200);
  }
}
