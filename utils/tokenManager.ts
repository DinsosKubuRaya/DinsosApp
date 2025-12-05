import * as SecureStore from "expo-secure-store";

export const TokenManager = {
  async setTokenData(token: string, userData: any, tokenId?: string) {
    await SecureStore.setItemAsync("token", token);
    await SecureStore.setItemAsync("role", userData.role);
    await SecureStore.setItemAsync("user_id", String(userData.id));
    await SecureStore.setItemAsync("name", userData.name);
    await SecureStore.setItemAsync("username", userData.username);
    await SecureStore.setItemAsync("photo_url", userData.photo_url || "");

    if (tokenId) {
      await SecureStore.setItemAsync("token_id", String(tokenId));
    }
  },

  async clearTokenData() {
    const keys = [
      "token",
      "role",
      "user_id",
      "name",
      "username",
      "photo_url",
      "token_id",
    ];
    await Promise.all(keys.map((key) => SecureStore.deleteItemAsync(key)));
  },

  async getStoredToken() {
    return await SecureStore.getItemAsync("token");
  },

  async getStoredRole() {
    return await SecureStore.getItemAsync("role");
  },

  // ✅ Perbaikan: menambahkan getTokenData
  async getTokenData() {
    const token = await this.getStoredToken();
    const role = await this.getStoredRole();
    const userId = await SecureStore.getItemAsync("user_id");
    const name = await SecureStore.getItemAsync("name");
    const username = await SecureStore.getItemAsync("username");
    const photo_url = await SecureStore.getItemAsync("photo_url");

    return {
      token,
      user: {
        id: userId,
        role,
        name,
        username,
        photo_url,
      },
    };
  },
};
