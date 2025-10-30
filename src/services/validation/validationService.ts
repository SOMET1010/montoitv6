export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export class ValidationService {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^(\+225)?[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  static validateCIPhoneNumber(phone: string): boolean {
    const cleanPhone = phone.replace(/\s/g, '').replace('+225', '');
    return /^[0-9]{10}$/.test(cleanPhone);
  }

  static validateRequired(value: any, fieldName: string): string | null {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} est requis`;
    }
    return null;
  }

  static validateMinLength(value: string, minLength: number, fieldName: string): string | null {
    if (value.length < minLength) {
      return `${fieldName} doit contenir au moins ${minLength} caractères`;
    }
    return null;
  }

  static validateMaxLength(value: string, maxLength: number, fieldName: string): string | null {
    if (value.length > maxLength) {
      return `${fieldName} ne doit pas dépasser ${maxLength} caractères`;
    }
    return null;
  }

  static validateNumber(value: any, fieldName: string): string | null {
    if (isNaN(value) || value === null || value === undefined) {
      return `${fieldName} doit être un nombre valide`;
    }
    return null;
  }

  static validatePositiveNumber(value: number, fieldName: string): string | null {
    if (value <= 0) {
      return `${fieldName} doit être un nombre positif`;
    }
    return null;
  }

  static validateRange(value: number, min: number, max: number, fieldName: string): string | null {
    if (value < min || value > max) {
      return `${fieldName} doit être entre ${min} et ${max}`;
    }
    return null;
  }

  static validateDate(dateString: string, fieldName: string): string | null {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return `${fieldName} doit être une date valide`;
    }
    return null;
  }

  static validateFutureDate(dateString: string, fieldName: string): string | null {
    const dateError = this.validateDate(dateString, fieldName);
    if (dateError) return dateError;

    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      return `${fieldName} doit être une date future`;
    }
    return null;
  }

  static validateDateRange(startDate: string, endDate: string): string | null {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return 'La date de fin doit être postérieure à la date de début';
    }
    return null;
  }

  static validateONECINumber(number: string): boolean {
    const cleanNumber = number.replace(/\s/g, '');
    return /^[A-Z0-9]{8,15}$/.test(cleanNumber);
  }

  static validateCNAMNumber(number: string): boolean {
    const cleanNumber = number.replace(/\s/g, '');
    return /^[0-9]{10,15}$/.test(cleanNumber);
  }

  static validatePropertyForm(data: any): ValidationResult {
    const errors: Record<string, string> = {};

    const requiredError = this.validateRequired(data.title, 'Titre');
    if (requiredError) errors.title = requiredError;

    const addressError = this.validateRequired(data.address, 'Adresse');
    if (addressError) errors.address = addressError;

    const cityError = this.validateRequired(data.city, 'Ville');
    if (cityError) errors.city = cityError;

    const typeError = this.validateRequired(data.property_type, 'Type de propriété');
    if (typeError) errors.property_type = typeError;

    const rentError = this.validatePositiveNumber(data.monthly_rent, 'Loyer mensuel');
    if (rentError) errors.monthly_rent = rentError;

    const surfaceError = this.validatePositiveNumber(data.surface_area, 'Surface');
    if (surfaceError) errors.surface_area = surfaceError;

    const bedroomsError = this.validateNumber(data.bedrooms, 'Chambres');
    if (bedroomsError) errors.bedrooms = bedroomsError;

    const bathroomsError = this.validateNumber(data.bathrooms, 'Salles de bain');
    if (bathroomsError) errors.bathrooms = bathroomsError;

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateLeaseForm(data: any): ValidationResult {
    const errors: Record<string, string> = {};

    const propertyError = this.validateRequired(data.property_id, 'Propriété');
    if (propertyError) errors.property_id = propertyError;

    const tenantError = this.validateRequired(data.tenant_id, 'Locataire');
    if (tenantError) errors.tenant_id = tenantError;

    const rentError = this.validatePositiveNumber(data.monthly_rent, 'Loyer mensuel');
    if (rentError) errors.monthly_rent = rentError;

    const depositError = this.validatePositiveNumber(data.deposit_amount, 'Dépôt de garantie');
    if (depositError) errors.deposit_amount = depositError;

    const startDateError = this.validateFutureDate(data.start_date, 'Date de début');
    if (startDateError) errors.start_date = startDateError;

    const endDateError = this.validateFutureDate(data.end_date, 'Date de fin');
    if (endDateError) errors.end_date = endDateError;

    if (!startDateError && !endDateError) {
      const rangeError = this.validateDateRange(data.start_date, data.end_date);
      if (rangeError) errors.end_date = rangeError;
    }

    const paymentDayError = this.validateRange(data.payment_day, 1, 31, 'Jour de paiement');
    if (paymentDayError) errors.payment_day = paymentDayError;

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validatePaymentForm(data: any): ValidationResult {
    const errors: Record<string, string> = {};

    const amountError = this.validatePositiveNumber(data.amount, 'Montant');
    if (amountError) errors.amount = amountError;

    const phoneError = this.validateRequired(data.phone, 'Numéro de téléphone');
    if (phoneError) {
      errors.phone = phoneError;
    } else if (!this.validateCIPhoneNumber(data.phone)) {
      errors.phone = 'Numéro de téléphone invalide';
    }

    const methodError = this.validateRequired(data.payment_method, 'Méthode de paiement');
    if (methodError) errors.payment_method = methodError;

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/<[^>]*>/g, '');
  }

  static formatCurrency(amount: number): string {
    return amount.toLocaleString('fr-FR') + ' FCFA';
  }

  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('225')) {
      return `+225 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
    }
    return `+225 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
  }
}
