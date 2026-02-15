import { X } from 'lucide-react';

function PrivacyPolicy({ type, onClose }) {
  const isPrivacy = type === 'privacy';
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 animate-fade" onClick={onClose}>
      <div className="glass rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 animate-slide" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-c-text">{isPrivacy ? '개인정보처리방침' : '이용약관'}</h2>
          <button onClick={onClose} className="text-c-text3"><X size={20} /></button>
        </div>
        {isPrivacy ? (
          <div className="text-sm text-c-text2 space-y-4 leading-relaxed">
            <p className="font-bold text-c-text">1. 수집하는 개인정보</p>
            <p>MyFinance는 서비스 제공을 위해 다음 정보를 수집합니다: 이메일 주소, 이름(선택), Google 계정 정보(Google 로그인 시). 재무 데이터(거래내역, 예산, 포트폴리오 등)는 사용자가 직접 입력하며 Firebase Firestore에 암호화되어 저장됩니다.</p>
            <p className="font-bold text-c-text">2. 개인정보의 이용 목적</p>
            <p>수집된 정보는 서비스 제공, 사용자 인증, 데이터 동기화 목적으로만 사용됩니다. 제3자에게 제공하거나 광고 목적으로 사용하지 않습니다.</p>
            <p className="font-bold text-c-text">3. 개인정보의 보관 및 파기</p>
            <p>회원 탈퇴 시 모든 개인정보는 즉시 삭제됩니다. 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관 후 파기합니다.</p>
            <p className="font-bold text-c-text">4. 개인정보의 안전성 확보</p>
            <p>Firebase의 보안 인프라를 통해 데이터를 안전하게 관리합니다. 전송 구간은 SSL/TLS로 암호화됩니다.</p>
            <p className="font-bold text-c-text">5. 이용자의 권리</p>
            <p>사용자는 언제든지 자신의 개인정보를 열람, 수정, 삭제할 수 있으며 설정 &gt; 데이터 관리에서 전체 데이터를 백업하거나 초기화할 수 있습니다.</p>
            <p className="font-bold text-c-text">6. 문의</p>
            <p>개인정보 관련 문의: rmsfid11@gmail.com</p>
            <p className="text-xs text-c-text3 mt-4">시행일: 2026년 2월 15일</p>
          </div>
        ) : (
          <div className="text-sm text-c-text2 space-y-4 leading-relaxed">
            <p className="font-bold text-c-text">제1조 (목적)</p>
            <p>이 약관은 MyFinance(이하 "서비스")의 이용조건 및 절차에 관한 기본 사항을 규정함을 목적으로 합니다.</p>
            <p className="font-bold text-c-text">제2조 (서비스 내용)</p>
            <p>서비스는 개인 재무관리 도구로서 가계부, 투자 포트폴리오 추적, 예산 관리, 통계 분석 등의 기능을 제공합니다. 서비스는 참고용이며 재무적 조언을 구성하지 않습니다.</p>
            <p className="font-bold text-c-text">제3조 (이용자의 의무)</p>
            <p>이용자는 타인의 정보를 도용하거나 서비스를 부정하게 이용해서는 안 됩니다.</p>
            <p className="font-bold text-c-text">제4조 (서비스 제공의 변경 및 중단)</p>
            <p>서비스는 운영상 필요에 따라 변경되거나 중단될 수 있으며, 중요한 변경 시 사전 공지합니다.</p>
            <p className="font-bold text-c-text">제5조 (면책)</p>
            <p>서비스에서 제공하는 시세, 통계, 분석 정보는 참고용이며 투자 손실 등에 대해 책임지지 않습니다. 데이터의 정확성을 보장하지 않습니다.</p>
            <p className="font-bold text-c-text">제6조 (분쟁 해결)</p>
            <p>서비스 이용과 관련한 분쟁은 대한민국 법률에 따릅니다.</p>
            <p className="text-xs text-c-text3 mt-4">시행일: 2026년 2월 15일</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PrivacyPolicy;
