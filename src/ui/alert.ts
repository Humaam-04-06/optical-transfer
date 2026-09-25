/**
 * SpectraBeam - Playful Geometric SweetAlert2 Modal & Dialog Helper
 */

import Swal, { SweetAlertOptions } from 'sweetalert2';

export class Alert {
  private static getBaseConfig(): SweetAlertOptions {
    const isDark = document.documentElement.classList.contains('dark');
    return {
      customClass: {
        popup: isDark
          ? 'border-2 border-[#334155] rounded-[24px] shadow-pop-xl bg-[#1E293B] p-6 text-[#F8FAFC]'
          : 'border-2 border-[#1E293B] rounded-[24px] shadow-pop-xl bg-[#FFFDF5] p-6',
        title: isDark ? 'font-heading font-black text-2xl text-[#F8FAFC]' : 'font-heading font-black text-2xl text-[#1E293B]',
        htmlContainer: isDark ? 'font-body text-base text-[#94A3B8] leading-relaxed' : 'font-body text-base text-[#64748B] leading-relaxed',
        confirmButton: 'btn-candy mr-2',
        cancelButton: 'btn-candy btn-candy-secondary',
        actions: 'gap-3 mt-4',
      },
      buttonsStyling: false,
      background: isDark ? '#1E293B' : '#FFFDF5',
      color: isDark ? '#F8FAFC' : '#1E293B',
    };
  }

  public static success(title: string, text: string): Promise<any> {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'success',
      iconColor: '#34D399',
      title,
      text,
      confirmButtonText: 'Awesome! 🚀',
    });
  }

  public static info(title: string, htmlContent: string): Promise<any> {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'info',
      iconColor: '#8B5CF6',
      title,
      html: htmlContent,
      confirmButtonText: 'Got It!',
    });
  }

  public static warning(title: string, text: string): Promise<any> {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'warning',
      iconColor: '#FBBF24',
      title,
      text,
      confirmButtonText: 'Understand',
    });
  }

  public static async confirm(title: string, text: string, confirmButtonText: string = 'Yes, Proceed'): Promise<boolean> {
    const base = this.getBaseConfig();
    const result = await Swal.fire({
      ...base,
      icon: 'warning',
      iconColor: '#F472B6',
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Cancel',
      customClass: {
        ...base.customClass,
        confirmButton: 'btn-candy btn-candy-pink mr-2',
      },
    });
    return result.isConfirmed;
  }

  public static async promptPassphrase(): Promise<string | null> {
    const result = await Swal.fire({
      ...this.getBaseConfig(),
      title: '🔐 SpectraVault Decryption',
      text: 'Enter the sender passphrase to unlock this encrypted optical stream:',
      input: 'password',
      inputPlaceholder: 'Enter passphrase',
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off',
        class: 'input-geometric mt-3 text-center tracking-widest',
      },
      showCancelButton: true,
      confirmButtonText: 'Unlock & Decrypt',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'Passphrase cannot be empty!';
        }
        return null;
      },
    });
    return result.isConfirmed && result.value ? (result.value as string) : null;
  }
}
