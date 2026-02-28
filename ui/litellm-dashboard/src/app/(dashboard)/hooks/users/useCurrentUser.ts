import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { UserInfo, userInfoCall } from "@/components/networking";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { createQueryKeys } from "../common/queryKeysFactory";

const userKeys = createQueryKeys("users");

export const useCurrentUser = (): UseQueryResult<UserInfo> => {
  const { accessToken, userId, userRole } = useAuthorized();
  return useQuery<UserInfo>({
    queryKey: userKeys.detail(userId!),
    queryFn: async () => {
      const data = await userInfoCall(accessToken!, userId!, userRole!, false, null, null);
      console.log(`userInfo: ${JSON.stringify(data)}`);
      // Some deployments return { user_info: {...} }, others return the user object directly.
      return (data.user_info ?? data) as UserInfo;
    },
    enabled: Boolean(accessToken && userId && userRole),
  });
};
