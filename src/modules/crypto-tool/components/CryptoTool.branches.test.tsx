import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';

vi.mock('./tabs/SymmetricTab', () => ({
  default: ({ activeTab }: { activeTab: string }) => <div>Symmetric:{activeTab}</div>,
}));
vi.mock('./tabs/AEADTab', () => ({
  default: ({ activeTab }: { activeTab: string }) => <div>AEAD:{activeTab}</div>,
}));
vi.mock('./tabs/RCTab', () => ({
  default: () => <div>View:RC</div>,
}));
vi.mock('./tabs/BlowfishTab', () => ({
  default: () => <div>View:Blowfish</div>,
}));
vi.mock('./tabs/OpenSSLTab', () => ({
  default: () => <div>View:OpenSSL</div>,
}));
vi.mock('./tabs/RSATab', () => ({
  default: () => <div>View:RSA</div>,
}));
vi.mock('./tabs/ECDSATab', () => ({
  default: () => <div>View:ECDSA</div>,
}));
vi.mock('./tabs/Ed25519Tab', () => ({
  default: () => <div>View:Ed25519</div>,
}));
vi.mock('./tabs/X25519Tab', () => ({
  default: () => <div>View:X25519</div>,
}));
vi.mock('./tabs/ECDHTab', () => ({
  default: () => <div>View:ECDH</div>,
}));
vi.mock('./tabs/HashTab', () => ({
  default: () => <div>View:Hash</div>,
}));
vi.mock('./tabs/SM3Tab', () => ({
  default: () => <div>View:SM3</div>,
}));
vi.mock('./tabs/KDFTab', () => ({
  default: () => <div>View:KDF</div>,
}));
vi.mock('./tabs/ClassicalTab', () => ({
  default: ({ activeTab }: { activeTab: string }) => <div>Classical:{activeTab}</div>,
}));
vi.mock('./tabs/SM2Tab', () => ({
  default: () => <div>View:SM2</div>,
}));
vi.mock('./tabs/SM4Tab', () => ({
  default: () => <div>View:SM4</div>,
}));
vi.mock('./tabs/ZUCTab', () => ({
  default: () => <div>View:ZUC</div>,
}));
vi.mock('./tabs/GMInfoTab', () => ({
  default: () => <div>View:GMInfo</div>,
}));
vi.mock('./tabs/JWTTab', () => ({
  default: () => <div>View:JWT</div>,
}));

import CryptoTool from './CryptoTool';

describe('CryptoTool branching', () => {
  it.each([
    [undefined, 'Symmetric:aes'],
    ['des', 'Symmetric:des'],
    ['aes-gcm', 'AEAD:aes-gcm'],
    ['rc', 'View:RC'],
    ['blowfish', 'View:Blowfish'],
    ['openssl', 'View:OpenSSL'],
    ['rsa', 'View:RSA'],
    ['ecdsa', 'View:ECDSA'],
    ['ed25519', 'View:Ed25519'],
    ['x25519', 'View:X25519'],
    ['ecdh', 'View:ECDH'],
    ['hash', 'View:Hash'],
    ['sm3', 'View:SM3'],
    ['kdf', 'View:KDF'],
    ['substitute', 'Classical:substitute'],
    ['transpose', 'Classical:transpose'],
    ['encode', 'Classical:encode'],
    ['sm2', 'View:SM2'],
    ['sm4', 'View:SM4'],
    ['zuc', 'View:ZUC'],
    ['gm-info', 'View:GMInfo'],
    ['jwt', 'View:JWT'],
    ['unknown-type', 'Symmetric:aes'],
  ])('renders expected tab content for initialType=%s', async (initialType, marker) => {
    render(<CryptoTool initialType={initialType as string | undefined} />);
    expect(await screen.findByText(marker)).toBeInTheDocument();
  });

  it('switches category tabs and resets to category defaults', async () => {
    render(<CryptoTool initialType="x25519" />);

    expect(await screen.findByText('View:X25519')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /#️⃣ 哈希算法/i }));
    expect(await screen.findByText('View:Hash')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /📜 古典密码/i }));
    expect(await screen.findByText('Classical:substitute')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /🇨🇳 国密算法/i }));
    expect(await screen.findByText('View:SM2')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /🎫 JWT/i }));
    expect(await screen.findByText('View:JWT')).toBeInTheDocument();
  });
});
