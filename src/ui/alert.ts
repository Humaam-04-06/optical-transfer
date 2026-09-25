/**
 * SpectraBeam - Playful Geometric SweetAlert2 Modal & Dialog Helper
 */

import Swal, { SweetAlertOptions } from 'sweetalert2';

export class Alert {
  private static baseConfig: SweetAlertOptions = {
    customClass: {
      popup: 'border-2 border-[#1E293B] rounded-[24px] shadow-pop-xl bg-[#FFFDF5] p-6',
      title: 'font-heading font-black text-2xl text-[#1E293B]',
      htmlContainer: 'font-body text-base text-[#64748B] leading-relaxed',
      confirmButton: 'btn-candy mr-2',
      cancelButton: 'btn-candy btn-candy-secondary',
      actions: 'gap-3 mt-4',
    },
    buttonsStyling: false,
    background: '#FFFDF5',
    color: '#1E293B',
  };

  public static success(title: string, text: string): Promise<any> {
    return Swal.fire({
      ...this.baseConfig,
      icon: 'success',
      iconColor: '#34D399',
      title,
      text,
      confirmButtonText: 'Awesome! 🚀',
    });
  }

  public static info(title: string, htmlContent: string): Promise<any> {
    return Swal.fire({
      ...this.baseConfig,
      icon: 'info',
      iconColor: '#8B5CF6',
      title,
      html: htmlContent,
      confirmButtonText: 'Got It!',
    });
  }

  public static warning(title: string, text: string): Promise<any> {
    return Swal.fire({
      ...this.baseConfig,
      icon: 'warning',
      iconColor: '#FBBF24',
      title,
      text,
      confirmButtonText: 'Understand',
    });
  }

  public static async confirm(title: string, text: string, confirmButtonText: string = 'Yes, Proceed'): Promise<boolean> {
    const result = await Swal.fire({
      ...this.baseConfig,
      icon: 'warning',
      iconColor: '#F472B6',
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Cancel',
      customClass: {
        ...this.baseConfig.customClass,
        confirmButton: 'btn-candy btn-candy-pink mr-2',
      },
    });
    return result.isConfirmed;
  }

  public static async promptPassphrase(): Promise<string | null> {
    const result = await Swal.fire({
      ...this.baseConfig,
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

    if (result.isConfirmed && result.value) {
      return result.value as string;
    }
    return null;
  }
}
