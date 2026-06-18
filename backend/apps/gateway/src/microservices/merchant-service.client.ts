import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  MERCHANT_SERVICE_PATTERNS,
  MerchantActionByIdPayload,
  MerchantByIdPayload,
  MerchantOffersByMerchantIdPayload,
  OfferByIdPayload,
  RedemptionValidatePayload,
  StudentScopedPayload,
  UserScopedPayload,
} from '@app/contracts';
import { firstValueFrom } from 'rxjs';

export const MERCHANT_SERVICE_CLIENT = 'MERCHANT_SERVICE_CLIENT';

@Injectable()
export class MerchantServiceClient {
  constructor(
    @Inject(MERCHANT_SERVICE_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  healthPing() {
    return this.send(MERCHANT_SERVICE_PATTERNS.healthPing);
  }

  registerMerchant(body: Record<string, unknown>) {
    return this.send(MERCHANT_SERVICE_PATTERNS.merchantRegister, body);
  }

  getMyMerchantProfile(payload: UserScopedPayload) {
    return this.send(MERCHANT_SERVICE_PATTERNS.merchantGetMyProfile, payload);
  }

  updateMyMerchantProfile(payload: UserScopedPayload<Record<string, unknown>>) {
    return this.send(MERCHANT_SERVICE_PATTERNS.merchantUpdateMyProfile, payload);
  }

  getMerchantById(payload: MerchantByIdPayload) {
    return this.send(MERCHANT_SERVICE_PATTERNS.merchantGetById, payload);
  }

  getAdminMerchantList() {
    return this.send(MERCHANT_SERVICE_PATTERNS.merchantAdminList);
  }

  getAdminOffersByMerchantId(payload: MerchantOffersByMerchantIdPayload) {
    return this.send(MERCHANT_SERVICE_PATTERNS.merchantAdminGetOffersByMerchantId, payload);
  }

  getAdminOverviewStats() {
    return this.send(MERCHANT_SERVICE_PATTERNS.merchantAdminGetOverviewStats);
  }

  getMyOverviewStats(payload: UserScopedPayload) {
    return this.send(MERCHANT_SERVICE_PATTERNS.merchantGetMyOverviewStats, payload);
  }

  getMyMerchantStatus(payload: UserScopedPayload) {
    return this.send(MERCHANT_SERVICE_PATTERNS.merchantGetMyStatus, payload);
  }

  updateMerchantApproval(payload: MerchantActionByIdPayload<Record<string, unknown>>) {
    return this.send(MERCHANT_SERVICE_PATTERNS.merchantUpdateApproval, payload);
  }

  updateMerchantSuspension(payload: MerchantActionByIdPayload<Record<string, unknown>>) {
    return this.send(MERCHANT_SERVICE_PATTERNS.merchantUpdateSuspension, payload);
  }

  setMyMerchantSecretCode(payload: UserScopedPayload<Record<string, unknown>>) {
    return this.send(MERCHANT_SERVICE_PATTERNS.merchantSetSecretCode, payload);
  }

  createOffer(payload: UserScopedPayload<Record<string, unknown>>) {
    return this.send(MERCHANT_SERVICE_PATTERNS.offerCreate, payload);
  }

  updateOffer(payload: OfferByIdPayload<Record<string, unknown>>) {
    return this.send(MERCHANT_SERVICE_PATTERNS.offerUpdate, payload);
  }

  toggleOffer(payload: OfferByIdPayload<Record<string, unknown>>) {
    return this.send(MERCHANT_SERVICE_PATTERNS.offerToggle, payload);
  }

  deleteOffer(payload: OfferByIdPayload) {
    return this.send(MERCHANT_SERVICE_PATTERNS.offerDelete, payload);
  }

  getMerchantOffers(payload: UserScopedPayload) {
    return this.send(MERCHANT_SERVICE_PATTERNS.offerGetMerchantOffers, payload);
  }

  getActiveOffers() {
    return this.send(MERCHANT_SERVICE_PATTERNS.offerGetActiveOffers);
  }

  getRedeemedOffersForStudent(payload: StudentScopedPayload) {
    return this.send(MERCHANT_SERVICE_PATTERNS.offerGetRedeemedOffersForStudent, payload);
  }

  createVoucher(payload: UserScopedPayload<Record<string, unknown>>) {
    return this.send(MERCHANT_SERVICE_PATTERNS.voucherCreate, payload);
  }

  validateAndRedeem(payload: RedemptionValidatePayload) {
    return this.send(MERCHANT_SERVICE_PATTERNS.redemptionValidateAndRedeem, payload);
  }

  getMerchantActivity(payload: UserScopedPayload) {
    return this.send(MERCHANT_SERVICE_PATTERNS.redemptionGetMerchantActivity, payload);
  }

  private send<TResult = unknown, TPayload = unknown>(
    pattern: string,
    payload?: TPayload,
  ): Promise<TResult> {
    const safePayload = (payload ?? ({} as TPayload)) as TPayload;

    return firstValueFrom(this.client.send<TResult, TPayload>(pattern, safePayload)).catch(
      (error: unknown) => {
        throw this.mapRpcErrorToHttpException(error);
      },
    );
  }

  private mapRpcErrorToHttpException(error: unknown): HttpException {
    if (error instanceof HttpException) {
      return error;
    }

    const raw = this.extractRpcErrorPayload(error);
    const statusCode = this.readStatusCode(raw);
    const message = this.readMessage(raw);

    if (statusCode) {
      return new HttpException({ statusCode, message }, statusCode);
    }

    return new BadGatewayException(message ?? 'Request to merchant service failed');
  }

  private extractRpcErrorPayload(error: unknown): unknown {
    if (!error || typeof error !== 'object') {
      return error;
    }

    const record = error as Record<string, unknown>;
    return record.error ?? record.response ?? record;
  }

  private readStatusCode(payload: unknown): number | undefined {
    if (!payload || typeof payload !== 'object') {
      return undefined;
    }

    const statusCode = (payload as Record<string, unknown>).statusCode;
    if (typeof statusCode === 'number') {
      return statusCode;
    }

    const status = (payload as Record<string, unknown>).status;
    if (typeof status === 'number') {
      return status;
    }

    return undefined;
  }

  private readMessage(payload: unknown): string | string[] {
    if (!payload || typeof payload !== 'object') {
      return 'Internal server error';
    }

    const message = (payload as Record<string, unknown>).message;

    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message;
    }

    if (typeof message === 'string') {
      return message;
    }

    return 'Internal server error';
  }
}
