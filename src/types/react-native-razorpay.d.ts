declare module "react-native-razorpay" {
  type RazorpayOptions = Record<string, unknown>;

  const RazorpayCheckout: {
    open<T = unknown>(options: RazorpayOptions): Promise<T>;
    onExternalWalletSelection(callback: (data: unknown) => void): void;
  };

  export default RazorpayCheckout;
}
